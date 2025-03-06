// ==UserScript==
// @name         Torn Hide Poker Buttons
// @namespace    https://github.com/neth392/Torn-Poker-Hide-Buttons
// @version      1.0.0
// @description  Configure hiding the "Leave" and "Sit out" buttons in torn.com's poker.
// @updateURL    https://github.com/neth392/Torn-Poker-Hide-Buttons/raw/main/poker_hide_buttons.user.js
// @downloadURL  https://github.com/neth392/Torn-Poker-Hide-Buttons/raw/main/poker_hide_buttons.user.js
// @author       neth [3564828]
// @match        https://www.torn.com/page.php?sid=holdem
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// ==/UserScript==


(function() {

  const SETTINGS_KEY = 'hiddenButtons'
  const SUPPORTED_BUTTONS = ['leave', 'sit out']

  const HOLDEM_WRAPPER_SELECTOR = 'main.sidebar div[class^="holdemWrapper_"]'
  const BUTTON_SELECTOR = '.sidebar button'

  let hiddenButtons = GM_getValue(SETTINGS_KEY, {})

  // Wait for the holdem wrapper to be added to the tree
  waitForElement(HOLDEM_WRAPPER_SELECTOR, holdemWrapper => {
    const observers = []

    const cleanUp = () => {
      // Clean up observers
      for (const observer of observers) {
        observer.disconnect()
      }
      observers.length = 0
    }

    const addSettingsElement = (panelElement) => {
      const settingsContainer = document.createElement('div')
      settingsContainer.style.display = 'flex'
      settingsContainer.style.flexDirection = 'column'
      settingsContainer.style.padding = '10px 0px 6px 4px'

      for (const supportedButton of SUPPORTED_BUTTONS) {
        const supportedButtonContainer = document.createElement('div')
        supportedButtonContainer.style.display = 'flex'
        supportedButtonContainer.style.flexDirection = 'row'
        supportedButtonContainer.style.alignItems = 'center'
        supportedButtonContainer.style.padding = '2px 0px 2px 0px'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `hideButtons-checkbox-${supportedButton}`
        checkbox.checked = supportedButton in hiddenButtons
        checkbox.style.marginRight = '4px'

        const label = document.createElement('label')
        label.htmlFor = checkbox.id
        label.id = `hideButtons-label-${supportedButton}`
        label.innerText = `Hide ${supportedButton}`
        label.style.fontSize = '14px'

        const onCheckboxChange = () => {
          if (checkbox.checked) {
            hideButton(getButtonWithInnerText(supportedButton))
            hiddenButtons[supportedButton] = true
          } else {
            showButton(getButtonWithInnerText(supportedButton))
            delete hiddenButtons[supportedButton]
          }
          saveHiddenButtons()
        }

        checkbox.addEventListener('change', onCheckboxChange)

        supportedButtonContainer.appendChild(checkbox)
        supportedButtonContainer.appendChild(label)

        settingsContainer.appendChild(supportedButtonContainer)
      }

      panelElement.appendChild(settingsContainer)
    }

    const onPanelAdded = (panel) => {
      // Monitor for buttons being added/removed
      const observer = observeChildAddedRemoved(panel, isSupportedButton, updateButtonVisibility)
      observers.push(observer)

      // Add the settings element
      addSettingsElement(panel)

      // Update all button visibilities right away
      SUPPORTED_BUTTONS.map(getButtonWithInnerText).forEach(updateButtonVisibility)
    }

    // Observe the panel being added/removed
    // For some reason we need to use the panelPositioner element and get the panel child from a query selector because
    // the panel element isn't appearing in mutation.addedNodes, maybe due to it being an existing element that is being
    // changed not added, but I can't be fucked to figure that out for this simple script.
    observeChildAddedRemoved(holdemWrapper, isPanelPositioner,
      (panelPositioner) => onPanelAdded(getPanelFromPositioner(panelPositioner)), cleanUp)
  })

  function updateButtonVisibility(button) {
    if (button) {
      button.innerText.toLowerCase() in hiddenButtons ? hideButton(button) : showButton(button)
    }
  }

  function isSupportedButton(element) {
    return element.tagName === 'BUTTON' && SUPPORTED_BUTTONS.includes(element.innerText.toLowerCase())
  }

  function getButtonWithInnerText(innerText) {
    const elements = document.querySelectorAll(BUTTON_SELECTOR)
    for (const element of elements) {
      if (element.innerText && element.innerText.toLowerCase() === innerText.toLowerCase()) {
        return element
      }
    }
    return null
  }

  function hideButton(button) {
    if (button) {
      button.style.display = 'none'
    }
  }

  function showButton(button) {
    if (button) {
      button.style.display = 'block'
    }
  }

  function saveHiddenButtons() {
    GM_setValue(SETTINGS_KEY, hiddenButtons)
  }

  function getPanelFromPositioner(panelPositioner) {
    return panelPositioner.querySelector('div[class^="panel_"]')
  }

  function isPanelPositioner(element) {
    if (!element || !element.classList) {
      return false
    }
    for (const className of Array.from(element.classList)) {
      if (className.startsWith('panelPositioner')) {
        return true
      }
    }
    return false
  }

  function waitForElement(selector, callback) {
    const element = document.querySelector(selector)
    if (element) {
      callback(element)
      return null
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        callback(element)
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  function observeChildAddedRemoved(element, predicate, onChildAdded, onChildRemoved) {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (predicate(addedNode)) {
            onChildAdded(addedNode)
          }
        }
        if (onChildRemoved) {
          for (const removedNode of mutation.removedNodes) {
            if (predicate(removedNode)) {
              onChildRemoved(removedNode)
            }
          }
        }
      }
    })

    observer.observe(element, { childList: true, subtree: true})
    return observer
  }

})();