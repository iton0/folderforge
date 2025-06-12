// TODO: add jsdocs to all functions
// TODO: remove all magic values

// Constants
const dragContainer = document.getElementById("drag-container");
const trashContainer = document.getElementById("trash");
const trashDefaultOpacity = 0.5;
const trashHoverOpacity = 0.8;
const depthBar = "│";
const nestingBar = "├─";

/**
 * Creates custom HTML element.
 * @param {string} elementType - The HTML element type (e.g., 'div', 'span', 'p').
 * @param {string} className - The element's class name.
 * @param {Object} [attributes={}] - An optional key-value object of element attributes (e.g., `{ id: 'my-id', 'data-value': '123' }`).
 * @returns {Element} The newly created HTML element.
 */
function createCustomElement(elementType, className, attributes = {}) {
  const newElement = document.createElement(elementType);

  newElement.classList.add(className);
  Object.keys(attributes).forEach((key) => {
    newElement.setAttribute(key, attributes[key]);
  });

  return newElement;
}

//  TODO: refactor nesting logic functions
function updateNestingLevel(dropTargetNestingLevel, draggedItem) {
  const newNestingLevel =
    dropTargetNestingLevel >= 0 ? parseInt(dropTargetNestingLevel) + 1 : 0;

  draggedItem.dataset.nestingLevel = newNestingLevel;

  if (draggedItem.getAttribute("class") === "folder") {
    const children = Array.from(
      draggedItem.querySelector(".children").children,
    );

    children.forEach((child) => {
      updateNestingLevel(newNestingLevel, child);
    });
  }
}

function removeNestingDiv(draggedItem) {
  draggedItem.querySelector(".depth").innerHTML = "";
  draggedItem.querySelector(".nested").innerHTML = "";

  if (draggedItem.getAttribute("class") === "folder") {
    const children = Array.from(
      draggedItem.querySelector(".children").children,
    );
    children.forEach((child) => {
      removeNestingDiv(child);
    });
  }
  return draggedItem;
}

function createDepth(depth, draggedItem) {
  const nestingLevel = parseInt(draggedItem.dataset.nestingLevel);
  for (let i = 1; i < nestingLevel; i++) {
    const depthBars = document.createElement("div");
    depthBars.innerHTML = depthBar;
    depthBars.style.paddingRight = "16px";
    depthBars.style.paddingLeft = "2px";
    depth.appendChild(depthBars);
  }
}

function createNestingBars(draggedItem) {
  const nestingBars = removeNestingDiv(draggedItem);
  const depth = nestingBars.querySelector(".depth");
  const nested = nestingBars.querySelector(".nested");

  createDepth(depth, draggedItem);

  nested.innerHTML =
    parseInt(draggedItem.dataset.nestingLevel) > 0 ? nestingBar : "";

  nested.style.paddingRight = nested.innerHTML === "" ? "0px" : "6px";
  nested.style.paddingLeft = nested.innerHTML === "" ? "0px" : "2px";

  if (draggedItem.getAttribute("class") === "folder") {
    const children = Array.from(
      draggedItem.querySelector(".children").children,
    );
    children.forEach((child) => {
      createNestingBars(child);
    });
  }
}

/** Checks for duplicate same-level file/folder names.
 * @param {array} children - list of children elements.
 * @param {string} itemName - name of the individual child.
 * @param {string} itemType - type of the individual child.
 * @return {boolean} if duplicate found.
 */
function IsDuplicateName(children, itemName, itemType) {
  const isDuplicate = Array.from(children).some((child) => {
    if (child && typeof child.querySelector === "function") {
      const inputElement = child.querySelector("input");
      if (inputElement) {
        const childName = inputElement.getAttribute("name");

        if (itemName === childName && itemName !== `new_${itemType}`) {
          return true;
        }
      }
    }
    return false;
  });

  if (isDuplicate) {
    alert(`A ${itemType} with that name already exists`);
  }

  return isDuplicate;
}

/** Creates file/folder HTML container.
 * @param {string} type - type of container ie file or folder.
 */
function createContainer(type) {
  const newContainer = createCustomElement("span", type, {
    "data-nesting-level": 0,
    draggable: true,
  });
  const containerContent = createCustomElement("div", "content");
  const nestingBars = createCustomElement("div", "nesting-bars");
  const depth = createCustomElement("div", "depth");
  const nested = createCustomElement("div", "nested");
  const dragHandle = createCustomElement("i", "drag-handle");
  const nameInput = createCustomElement("input", `${type}-name`);
  dragHandle.innerHTML = `<i class="fas fa-${type}"></i>`;
  nameInput.value = `new_${type}`;
  nameInput.name = nameInput.value;

  nameInput.classList.add(`${type}-name`);
  nestingBars.appendChild(depth);
  nestingBars.appendChild(nested);
  nameInput.addEventListener("focus", () => {
    nameInput.style.fontWeight = "bold";
  });
  nameInput.addEventListener("input", () => {
    newContainer.draggable = false;
    nameInput.name = nameInput.value.trim();
    nameInput.value = nameInput.value.replace(/\s+/g, " ");
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      nameInput.blur();
    }
  });
  nameInput.addEventListener("blur", () => {
    newContainer.draggable = true;
    nameInput.value = nameInput.value.trim();
    nameInput.style.fontWeight = "normal";

    if (nameInput.name === "") {
      nameInput.name = `new_${type}`;
      nameInput.value = nameInput.name;
    }

    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
    const siblings = Array.from(newContainer.parentElement.children).filter(
      (child) => {
        return (
          child !== nameInput.parentElement.parentElement &&
          child.querySelector("input") &&
          child.querySelector("input") !== nameInput
        );
      },
    );
    const currentName = nameInput.value;
    const hasDuplicateSibling = siblings.some((sibling) => {
      const siblingInput = sibling.querySelector("input");
      return (
        siblingInput.value !== `new_${type}` &&
        siblingInput.value === currentName
      );
    });

    // If sibling with same name exists returns to default name
    if (hasDuplicateSibling) {
      alert(`A ${type} with the same name already exists`);
      nameInput.name = `new_${type}`;
      nameInput.value = nameInput.name;
    }
  });

  const nestItems = createCustomElement("div", "children");

  containerContent.appendChild(nestingBars);
  containerContent.appendChild(dragHandle);
  containerContent.appendChild(nameInput);
  newContainer.appendChild(containerContent);
  // Files cannot have elements nested in them
  if (type === "folder") {
    newContainer.appendChild(nestItems);
  }
  dragContainer.appendChild(newContainer);

  // New container event listeners
  newContainer.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    e.target.setAttribute("data-temp-id", "temporary_id");
    e.dataTransfer.setData("text/plain", "temporary_id");
  });

  newContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  newContainer.addEventListener("drop", (e) => {
    e.stopPropagation();
    e.preventDefault();

    const dropTarget = e.currentTarget.querySelector(".children");
    const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
    const draggedItemName = draggedItem
      .querySelector("input")
      .getAttribute("name");
    const dropTargetNestingLevel = parseInt(
      dropTarget.parentElement.dataset.nestingLevel,
    );

    if (
      !draggedItem.contains(dropTarget) &&
      dropTarget.children !== draggedItem
    ) {
      const dropTargetChildren = dropTarget.children;
      const draggedItemType = draggedItem.getAttribute("class");

      const handleDropAction = (target, nestingLevel, item) => {
        updateNestingLevel(nestingLevel, item);
        createNestingBars(item);
        target.appendChild(item);
      };

      const isDuplicate = IsDuplicateName(
        dropTargetChildren,
        draggedItemName,
        draggedItemType,
      );

      if (!isDuplicate) {
        handleDropAction(dropTarget, dropTargetNestingLevel, draggedItem);
      }
    }
  });

  newContainer.addEventListener("dragend", (e) => {
    e.stopPropagation();
    const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
    if (draggedItem) {
      draggedItem.removeAttribute("data-temp-id");
    }
  });
}

function handleClear() {
  Array.from(dragContainer.children).forEach((child) => {
    if (child !== trashContainer) {
      child.remove();
    }
  });
}

function createFileSystem(zip, parentElement, basePath = "") {
  const folderName = parentElement
    .querySelector(".folder-name")
    .getAttribute("name");
  const folderPath = basePath === "" ? folderName : `${basePath}/${folderName}`;

  zip.folder(folderPath);

  const children = Array.from(
    parentElement.querySelector(".children").children,
  );
  children.forEach((child) => {
    if (child.getAttribute("class") === "file") {
      const fileName = child.querySelector(".file-name").getAttribute("name");
      zip.file(folderPath + "/" + fileName, "");
    } else {
      const childFolderName = child
        .querySelector(".folder-name")
        .getAttribute("name");
      zip.folder(folderPath + "/" + childFolderName);
      createFileSystem(zip, child, folderPath);
    }
  });
}

function handleForge() {
  const rootElement = dragContainer.querySelector(".folder");

  if (!rootElement) {
    alert("Root folder is missing");
    return;
  }

  const zip = new JSZip();

  const children = rootElement.querySelector(".children").children;

  if (children.length < 2) {
    alert("Root folder must have at least two elements");
    return;
  }

  const rootName = rootElement
    .querySelector(".folder-name")
    .getAttribute("name");

  createFileSystem(zip, rootElement);

  zip.generateAsync({ type: "blob" }).then((blob) => {
    const zipName = `${rootName}.zip`;
    saveAs(blob, zipName);
  });
}

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

// Drag container event listeners
dragContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dragContainer.addEventListener("drop", (e) => {
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');

  e.stopPropagation();
  e.preventDefault();
  updateNestingLevel(-1, draggedItem);
  createNestingBars(draggedItem);
  dropTarget.appendChild(draggedItem);
});

dragContainer.addEventListener("dragend", (e) => {
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
  draggedItem.removeAttribute("data-temp-id");

  e.stopPropagation();
});

// Trash container event listeners
trashContainer.addEventListener("dragover", (e) => {
  e.currentTarget.style.opacity = trashHoverOpacity;

  e.preventDefault();
  e.stopPropagation();
});

trashContainer.addEventListener("dragleave", (e) => {
  e.currentTarget.style.opacity = trashDefaultOpacity;

  e.preventDefault();
  e.stopPropagation();
});

trashContainer.addEventListener("drop", (e) => {
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
  e.currentTarget.style.opacity = trashDefaultOpacity;

  e.preventDefault();
  e.stopPropagation();
  draggedItem.remove();
});
