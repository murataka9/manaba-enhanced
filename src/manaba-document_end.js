"use strict"

import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat)

import "./manaba.sass"

window.onload = () => {
  const url = window.location.href

  if (url.indexOf("home_library_query") !== -1) {
    colorizeDeadline({})
  } else if (
    url.lastIndexOf("query") === url.length - 5 ||
    url.lastIndexOf("survey") === url.length - 6 ||
    url.lastIndexOf("report") === url.length - 6
  ) {
    colorizeDeadline({ checkStatus: true })
  }

  if (url.indexOf("report") !== -1) {
    const submitBtn = document.querySelector(
      "input[name='action_ReportStudent_submitdone']"
    )
    if (submitBtn) {
      syncReportText()

      chrome.storage.local.getBytesInUse((bytesInUse) => {
        if (bytesInUse > 4500000) {
          clearStorage()
        }
      })
    }
  }
}

const colorizeDeadline = ({ checkStatus = false }) => {
  const now = dayjs()

  const rows = document.querySelectorAll(".row0, .row1, .row")

  const evalDeadline = (row) => {
    const deadline = row.childNodes[row.childNodes.length - 2].innerHTML
    if (deadline) {
      const target = dayjs(deadline, "YYYY-MM-DD HH:mm")
      const diffDays = target.diff(now, "day")

      if (diffDays < 1) {
        row.classList.add("one-day-before")
      } else if (diffDays < 3) {
        row.classList.add("three-days-before")
      } else if (diffDays < 7) {
        row.classList.add("seven-days-before")
      }
    }
  }

  for (const row of rows) {
    if (checkStatus) {
      const status = row.childNodes[row.childNodes.length - 6].innerHTML
      if (
        (status.indexOf("未提出") !== -1 &&
          status.indexOf("受付終了") === -1) ||
        (status.indexOf("Not submitted") !== -1 &&
          status.indexOf("Closed") === -1)
      ) {
        evalDeadline(row)
      }
    } else {
      evalDeadline(row)
    }
  }
}

const syncReportText = () => {
  const textarea = document.getElementsByTagName("textarea")[0]

  const getId = () => {
    const url = window.location.href
    return url.substr(url.indexOf("manaba.tsukuba.ac.jp/ct/") + 24)
  }

  chrome.storage.local.get("reportText", (result) => {
    if (Object.keys(result).length) {
      textarea.value = result.reportText[getId()].text
    }
  })

  const writeReportText = (id, text) => {
    chrome.storage.local.get("reportText", (result) => {
      if (!Object.keys(result).length) {
        result = {}
        chrome.storage.local.set({ reportText: {} })
      }
      if (!Object.keys(result.reportText).length) {
        result.reportText = {}
      }
      result.reportText[id] = {
        text: text,
        modified: Date.now(),
      }

      chrome.storage.local.set(result)
    })
  }

  if (textarea) {
    textarea.addEventListener("input", (e) => {
      if (!e.isComposing) {
        writeReportText(getId(), textarea.value)
      }
    })
    window.onkeyup = (e) => {
      if (e.code === "Enter") {
        writeReportText(getId(), textarea.value)
      }
    }
  }
}

const clearStorage = () => {
  let curOldestKey
  let curMinModified = 99999999999999

  chrome.storage.local.get("reportText", (result) => {
    for (const key of Object.keys(result.reportText)) {
      if (result.reportText[key].modified < curMinModified) {
        curOldestKey = key
        curMinModified = result.reportText[key].modified
      }
    }
    delete result.reportText[curOldestKey]
    chrome.storage.local.set(result)

    chrome.storage.local.getBytesInUse((bytesInUse) => {
      if (bytesInUse > 4500000) {
        clearStorage()
      }
    })
  })
}
