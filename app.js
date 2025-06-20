// Global constants
/**
 * @const {HTMLElement}
 */
const DRAG_CONTAINER = document.getElementById("drag-container");
/**
 * @const {HTMLElement}
 */
const TRASH_CONTAINER = document.getElementById("trash");
/**
 * @const {number}
 */
const TRASH_OPACITY = 0.5;
/**
 * @const {number}
 */
const TRASH_HOVER_OPACITY = 0.8;
/**
 * @const {string}
 */
const DEPTH_BAR = "│";
/**
 * @const {string}
 */
const NEST_BAR = "├─";
/**
 * @const {string}
 */
const NEST_DEFAULT_PADDING = "0px";
/**
 * @const {string}
 */
const NEST_LEFT_PADDING = "2px";
/**
 * @const {string}
 */
const NEST_RIGHT_PADDING = "6px";
/**
 * @const {string}
 */
const DEPTH_LEFT_PADDING = "2px";
/**
 * @const {string}
 */
const DEPTH_RIGHT_PADDING = "16px";

/**
 * Creates custom HTML element.
 *
 * @param {string} elementType - The HTML element type (e.g., 'div', 'span', 'p')
 * @param {string} className - The element's class name
 * @param {Object} [attributes={}] - An optional key-value object of element attributes (e.g., `{ id: 'my-id', 'data-value': '123' }`.
 * @returns {HTMLElement} The newly created HTML element
 */
function createCustomElement(elementType, className, attributes = {}) {
  /**
   * @const {HTMLElement}
   */
  const NEW_ELEMENT = document.createElement(elementType);

  NEW_ELEMENT.classList.add(className);
  Object.keys(attributes).forEach((key) => {
    NEW_ELEMENT.setAttribute(key, attributes[key]);
  });

  return NEW_ELEMENT;
}

/**
 * Updates nesting level for element and its children based on the nesting
 * level of the drop target.
 *
 * @param {number} targetNestLevel - The nesting level of the target
 * HTML element
 * @param {HTMLElement} dragElement - The HTML element that is currently being
 * dragged
 */
function updateNestLevel(targetNestLevel, dragElement) {
  /**
   * @const {number}
   */
  const NEW_NEST_LEVEL = targetNestLevel !== -1 ? targetNestLevel + 1 : 0;
  dragElement.dataset.nestingLevel = NEW_NEST_LEVEL;

  if (dragElement.getAttribute("class") === "folder") {
    /**
     * @const {HTMLElement[]}
     */
    const CHILDREN = Array.from(
      dragElement.querySelector(".children").children,
    );

    CHILDREN.forEach((child) => {
      updateNestLevel(NEW_NEST_LEVEL, child);
    });
  }
}

/**
 * Removes the nest bars from HTML element and its children.
 *
 * @param {HTMLElement} element - The HTML that will have nest bars removed
 */
function removeNestDiv(element) {
  element.querySelector(".depth").innerHTML = "";
  element.querySelector(".nested").innerHTML = "";

  if (element.getAttribute("class") === "folder") {
    /**
     * @const {HTMLElement[]}
     */
    const CHILDREN = Array.from(element.querySelector(".children").children);

    CHILDREN.forEach((child) => {
      removeNestDiv(child);
    });
  }
}

/**
 * Creates the depth bars for a given HTML element.
 *
 * @param {HTMLElement} element - HTML element which depth bars will be added
 */
function createDepth(element) {
  /**
   * @const {HTMLElement}
   */
  const DEPTH = element.querySelector(".depth");

  for (let i = 1; i < parseInt(element.dataset.nestingLevel); i++) {
    /**
     * @const {HTMLElement}
     */
    const DEPTH_BARS = document.createElement("div");
    DEPTH_BARS.innerHTML = DEPTH_BAR;
    DEPTH_BARS.style.paddingLeft = DEPTH_LEFT_PADDING;
    DEPTH_BARS.style.paddingRight = DEPTH_RIGHT_PADDING;

    DEPTH.appendChild(DEPTH_BARS);
  }
}

/**
 * Creates the nesting bar for element and its children.
 *
 * @param {HTMLElement} element - element to create nesting bars
 */
function createNestBars(element) {
  removeNestDiv(element);
  createDepth(element);

  /**
   * @const {HTMLElement}
   */
  const NESTED = element.querySelector(".nested");

  NESTED.innerHTML = parseInt(element.dataset.nestingLevel) > 0 ? NEST_BAR : "";
  NESTED.style.paddingRight =
    NESTED.innerHTML === "" ? NEST_DEFAULT_PADDING : NEST_RIGHT_PADDING;
  NESTED.style.paddingLeft =
    NESTED.innerHTML === "" ? NEST_DEFAULT_PADDING : NEST_LEFT_PADDING;

  if (element.getAttribute("class") === "folder") {
    /**
     * @const {HTMLElement[]}
     */
    const CHILDREN = Array.from(element.querySelector(".children").children);
    CHILDREN.forEach((child) => {
      createNestBars(child);
    });
  }
}

/**
 * Checks for duplicate same-level file/folder named HTML elements.
 *
 * @param {HTMLElement[]} children - Array of children HTML elements
 * @param {string} elementName - Name of the individual child element
 * @param {string} elementType - Type of the individual child element
 * @return {boolean} If duplicate found
 */
function IsDuplicateName(children, elementName, elementType) {
  /**
   * @const {boolean}
   */
  const IS_DUPLICATE = Array.from(children).some((child) => {
    if (child && typeof child.querySelector === "function") {
      /**
       * @const {HTMLInputElement}
       */
      const INPUT_ELEMENT = child.querySelector("input");
      if (INPUT_ELEMENT) {
        /**
         * @const {string}
         */
        const CHILD_NAME = INPUT_ELEMENT.getAttribute("name");

        if (
          elementName === CHILD_NAME &&
          elementName !== `new_${elementType}`
        ) {
          return true;
        }
      }
    }
    return false;
  });

  if (IS_DUPLICATE) {
    alert(`A ${elementType} with that name already exists`);
  }

  return IS_DUPLICATE;
}

/**
 * Creates file/folder HTML container.
 *
 * @param {string} type - Type of container ie file or folder
 */
function createContainer(type) {
  /**
   * @const {HTMLElement}
   */
  const NEW_CONTAINER = createCustomElement("span", type, {
    "data-nesting-level": 0,
    draggable: true,
  });
  /**
   * @const {HTMLElement}
   */
  const CONTAINER_CONTENT = createCustomElement("div", "content");
  /**
   * @const {HTMLElement}
   */
  const NESTING_BARS = createCustomElement("div", "nesting-bars");
  /**
   * @const {HTMLElement}
   */
  const DEPTH = createCustomElement("div", "depth");
  /**
   * @const {HTMLElement}
   */
  const NESTED = createCustomElement("div", "nested");
  /**
   * @const {HTMLElement}
   */
  const DRAG_HANDLE = createCustomElement("i", "drag-handle");
  /**
   * @const {HTMLElement}
   */
  const NAME_INPUT = createCustomElement("input", `${type}-name`);
  DRAG_HANDLE.innerHTML = `<i class="bi bi-${type}-fill"></i>`;
  NAME_INPUT.value = `new_${type}`;
  NAME_INPUT.name = NAME_INPUT.value;

  NAME_INPUT.classList.add(`${type}-name`);
  NESTING_BARS.appendChild(DEPTH);
  NESTING_BARS.appendChild(NESTED);

  NAME_INPUT.addEventListener("focus", () => {
    NAME_INPUT.style.fontWeight = "bold";
  });
  NAME_INPUT.addEventListener("input", () => {
    NEW_CONTAINER.draggable = false;
    NAME_INPUT.name = NAME_INPUT.value.trim();
    NAME_INPUT.value = NAME_INPUT.value.replace(/\s+/g, " ");
  });
  NAME_INPUT.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      NAME_INPUT.blur();
    }
  });
  NAME_INPUT.addEventListener("blur", () => {
    NEW_CONTAINER.draggable = true;
    NAME_INPUT.value = NAME_INPUT.value.trim();
    NAME_INPUT.style.fontWeight = "normal";

    if (NAME_INPUT.name === "") {
      NAME_INPUT.name = `new_${type}`;
      NAME_INPUT.value = NAME_INPUT.name;
    }

    NAME_INPUT.setSelectionRange(
      NAME_INPUT.value.length,
      NAME_INPUT.value.length,
    );

    /**
     * const {HTMLElement[]}
     */
    const SIBLINGS = Array.from(NEW_CONTAINER.parentElement.children).filter(
      (child) => {
        return (
          child !== NAME_INPUT.parentElement.parentElement &&
          child.querySelector("input") &&
          child.querySelector("input") !== NAME_INPUT
        );
      },
    );

    /**
     * @const {boolean}
     */
    const DUPLICATE_SIBLING = SIBLINGS.some((sibling) => {
      /**
       * @const {string}
       */
      const CURRENT_NAME = NAME_INPUT.value;
      /**
       * @const {HTMLInputElement}
       */
      const SIBLING_INPUT = sibling.querySelector("input");
      return (
        SIBLING_INPUT.value !== `new_${type}` &&
        SIBLING_INPUT.value === CURRENT_NAME
      );
    });

    // If sibling with same name exists returns to default name
    if (DUPLICATE_SIBLING) {
      alert(`A ${type} with the same name already exists`);
      NAME_INPUT.name = `new_${type}`;
      NAME_INPUT.value = NAME_INPUT.name;
    }
  });

  /**
   * @const {HTMLElement}
   */
  const NEST_ELEMENTS = createCustomElement("div", "children");

  CONTAINER_CONTENT.appendChild(NESTING_BARS);
  CONTAINER_CONTENT.appendChild(DRAG_HANDLE);
  CONTAINER_CONTENT.appendChild(NAME_INPUT);
  NEW_CONTAINER.appendChild(CONTAINER_CONTENT);

  // Files cannot have elements nested in them
  if (type === "folder") {
    NEW_CONTAINER.appendChild(NEST_ELEMENTS);
  }
  DRAG_CONTAINER.appendChild(NEW_CONTAINER);

  // New container event listeners
  NEW_CONTAINER.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    e.target.setAttribute("data-temp-id", "temporary_id");
    e.dataTransfer.setData("text/plain", "temporary_id");
  });

  NEW_CONTAINER.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  NEW_CONTAINER.addEventListener("drop", (e) => {
    e.stopPropagation();
    e.preventDefault();

    /**
     * @const {HTMLElement}
     */
    const DROP_TARGET = e.currentTarget.querySelector(".children");
    /**
     * @const {HTMLElement}
     */
    const DRAG_ELEMENT = document.querySelector(
      '[data-temp-id="temporary_id"]',
    );
    /**
     * @const {string}
     */
    const DRAG_ELEMENT_NAME =
      DRAG_ELEMENT.querySelector("input").getAttribute("name");
    /**
     * @const {number}
     */
    const DROP_TARGET_NESTING_LEVEL = parseInt(
      DROP_TARGET.parentElement.dataset.nestingLevel,
    );
    /**
     * @const {HTMLCollection}
     */
    const DROP_TARGET_CHILDREN = DROP_TARGET.children;
    /**
     * @const {string}
     */
    const DRAG_ELEMENT_TYPE = DRAG_ELEMENT.getAttribute("class");
    /**
     * @const {boolean}
     */
    const DUPLICATE = IsDuplicateName(
      DROP_TARGET_CHILDREN,
      DRAG_ELEMENT_NAME,
      DRAG_ELEMENT_TYPE,
    );

    if (
      !DRAG_ELEMENT.contains(DROP_TARGET) &&
      DROP_TARGET.children !== DRAG_ELEMENT &&
      !DUPLICATE
    ) {
      updateNestLevel(DROP_TARGET_NESTING_LEVEL, DRAG_ELEMENT);
      createNestBars(DRAG_ELEMENT);
      DROP_TARGET.appendChild(DRAG_ELEMENT);
    }
  });

  NEW_CONTAINER.addEventListener("dragend", (e) => {
    e.stopPropagation();

    /**
     * @const {HTMLElement}
     */
    const DRAG_ELEMENT = document.querySelector(
      '[data-temp-id="temporary_id"]',
    );
    if (DRAG_ELEMENT) {
      DRAG_ELEMENT.removeAttribute("data-temp-id");
    }
  });
}

/**
 * Removes all files/folder from drag container (not including trash container).
 */
function handleClear() {
  Array.from(DRAG_CONTAINER.children).forEach((child) => {
    if (child !== TRASH_CONTAINER) {
      child.remove();
    }
  });
}

/**
 * Creates the file system based on a root folder.
 *
 * @param {JSZip} zip - the JSZip object
 * @param {HTMLElement} parentElement - the HTML element that is the root folder
 * @param {string} [basePath=""] - optional name for the zip folder itself
 */
function createFileSystem(zip, parentElement, basePath = "") {
  /**
   * @const {string}
   */
  const FOLDER_NAME = parentElement
    .querySelector(".folder-name")
    .getAttribute("name");

  /**
   * @const {string}
   */
  const FOLDER_PATH =
    basePath === "" ? FOLDER_NAME : `${basePath}/${FOLDER_NAME}`;

  zip.folder(FOLDER_PATH);

  Array.from(parentElement.querySelector(".children").children).forEach(
    (child) => {
      if (child.getAttribute("class") === "file") {
        /**
         * @const {string}
         */
        const FILE_NAME = child
          .querySelector(".file-name")
          .getAttribute("name");
        zip.file(FOLDER_PATH + "/" + FILE_NAME, "");
      } else {
        /**
         * @const {string}
         */
        const CHILD_FOLDER_NAME = child
          .querySelector(".folder-name")
          .getAttribute("name");
        zip.folder(FOLDER_PATH + "/" + CHILD_FOLDER_NAME);
        createFileSystem(zip, child, FOLDER_PATH);
      }
    },
  );
}

/**
 * Creates and downloads file system to local storage as zip folder.
 */
function handleForge() {
  /**
   * @const {HTMLElement}
   */
  const ROOT_ELEMENT = DRAG_CONTAINER.querySelector(".folder");
  if (!ROOT_ELEMENT) {
    alert("Root folder is missing");
    return;
  }

  /**
   * @const {HTMLCollection}
   */
  const CHILDREN = ROOT_ELEMENT.querySelector(".children").children;
  if (CHILDREN.length < 2) {
    alert("Root folder must have at least two elements");
    return;
  }

  /**
   * @const {JSZip}
   */
  const ZIP = new JSZip();
  /**
   * @const {string}
   */
  const ROOT_NAME =
    ROOT_ELEMENT.querySelector(".folder-name").getAttribute("name");

  createFileSystem(ZIP, ROOT_ELEMENT);

  ZIP.generateAsync({ type: "blob" }).then((blob) => {
    saveAs(blob, `${ROOT_NAME}.zip`);
  });
}

// Drag container event listeners
DRAG_CONTAINER.addEventListener("dragover", (e) => {
  e.preventDefault();
});

DRAG_CONTAINER.addEventListener("drop", (e) => {
  /**
   * @const {HTMLElement}
   */
  const DRAG_ELEMENT = document.querySelector('[data-temp-id="temporary_id"]');

  e.stopPropagation();
  e.preventDefault();
  updateNestLevel(-1, DRAG_ELEMENT);
  createNestBars(DRAG_ELEMENT);
  e.currentTarget.appendChild(DRAG_ELEMENT);
});

DRAG_CONTAINER.addEventListener("dragend", (e) => {
  /**
   * @const {HTMLElement}
   */
  const DRAG_ELEMENT = document.querySelector('[data-temp-id="temporary_id"]');
  DRAG_ELEMENT.removeAttribute("data-temp-id");

  e.stopPropagation();
});

// Trash container event listeners
TRASH_CONTAINER.addEventListener("dragover", (e) => {
  e.currentTarget.style.opacity = TRASH_HOVER_OPACITY;

  e.preventDefault();
  e.stopPropagation();
});

TRASH_CONTAINER.addEventListener("dragleave", (e) => {
  e.currentTarget.style.opacity = TRASH_OPACITY;

  e.preventDefault();
  e.stopPropagation();
});

TRASH_CONTAINER.addEventListener("drop", (e) => {
  /**
   * @const {HTMLElement}
   */
  const DRAG_ELEMENT = document.querySelector('[data-temp-id="temporary_id"]');
  e.currentTarget.style.opacity = TRASH_OPACITY;

  e.preventDefault();
  e.stopPropagation();
  DRAG_ELEMENT.remove();
});

// Button click event listener
document.addEventListener("click", (e) => {
  switch (e.target.id) {
    case "addFolder":
      createContainer("folder");
      break;
    case "addFile":
      createContainer("file");
      break;
    case "clear":
      handleClear();
      break;
    case "forge":
      handleForge();
      break;
    default:
      return;
  }
});

// Page load event listener
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").innerHTML = new Date().getFullYear();
});
