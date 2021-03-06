"use strict"

import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat)

window.addEventListener("DOMContentLoaded", () => {
  removeLinkBalloon()

  const pageLimitView = document.getElementsByClassName("pagelimitview")[0]
  if (pageLimitView) {
    checkPagePubDeadline(pageLimitView)
  }
})

const removeLinkBalloon = () => {
  const links = document.getElementsByTagName("a")

  const urlClamp = (url) => {
    if (url.length > 100) {
      return `${url.substr(0, 75)}...`
    } else {
      return url
    }
  }

  for (const link of links) {
    if (link.href.indexOf("link_iframe_balloon") !== -1) {
      const linkNew = document.createElement("a")
      const url = unescape(link.href.substr(56))
      linkNew.href = url
      linkNew.innerHTML =
        link.innerHTML.indexOf("http") === -1 ? link.innerHTML : urlClamp(url)
      linkNew.target = "_blank"
      linkNew.rel = "noopener noreferrer"

      link.parentElement.insertBefore(linkNew, link)
      link.remove()
    }
  }
}

const checkPagePubDeadline = (div) => {
  const match = new RegExp(
    "(\\d{4}-+\\d{2}-+\\d{2} \\d{2}:+\\d{2}:+\\d{2})",
    "g"
  )

  const checkLang = () => {
    const mylang = document.getElementById("mylang")
    if (mylang.className.indexOf("ja") !== -1) {
      return "ja"
    } else if (mylang.className.indexOf("en") !== -1) {
      return "en"
    }
  }

  const timeStrings = div.innerText.match(match)

  if (timeStrings.length === 2) {
    const deadlineString = timeStrings[1]

    const now = dayjs()
    const deadline = dayjs(deadlineString, "YYYY-MM-DD HH:mm:ss")

    const createMessage = (text, caution) => {
      const message = document.createElement("span")
      message.innerText = text
      message.style.marginLeft = "1em"
      message.style.padding = ".2em .5em"
      if (!caution) {
        message.style.backgroundColor = "#d3ebd3"
        message.style.color = "#244f24"
      } else {
        message.style.backgroundColor = "#ffdce0"
        message.style.color = "#5d000b"
      }
      div.appendChild(message)
    }

    const evalDiff = () => {
      const lang = checkLang()

      const diffDays = deadline.diff(now, "day")
      if (diffDays > 0) {
        switch (lang) {
          case "ja":
            createMessage(`あと${diffDays}日`, diffDays > 7 ? false : true)
            break
          case "en":
            createMessage(
              diffDays > 1
                ? `${diffDays} days remaining`
                : `${diffDays} day remaining`,
              diffDays > 7 ? false : true
            )
            break
        }
      } else {
        const diffHours = deadline.diff(now, "hour")
        if (diffHours > 0) {
          switch (lang) {
            case "ja":
              createMessage(`あと${diffHours}時間`, true)
              break
            case "en":
              createMessage(
                diffHours > 1
                  ? `${diffHours} hours remaining`
                  : `${diffHours} hour remaining`,
                true
              )
              break
          }
        } else {
          const diffMinutes = deadline.diff(now, "minute") + 1
          if (diffMinutes >= 0) {
            switch (lang) {
              case "ja":
                createMessage(`あと${diffMinutes}分`, true)
                break
              case "en":
                createMessage(
                  diffMinutes > 1
                    ? `${diffMinutes} minutes remaining`
                    : `${diffMinutes} minute remaining`,
                  true
                )
                break
            }
          } else {
            switch (lang) {
              case "ja":
                createMessage("公開終了", true)
                break
              case "en":
                createMessage("Viewing period is over", true)
                break
            }
          }
        }
      }
    }

    evalDiff()
  }
}
