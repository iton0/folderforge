// TODO: add jsdocs to all functions

// Constants
const dragContainer = document.getElementById("drag-container");
const trashContainer = document.querySelector(".trash");
const trashDefaultOpacity = 0.5;
const trashHoverOpacity = 0.8;

// Drag container event listeners
dragContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dragContainer.addEventListener("drop", (e) => {
  e.stopPropagation();
  e.preventDefault();
  const dropTarget = document.getElementById("drag-container");
  console.log("droptarget ", dropTarget);
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');

  updateNestingLevel(-1, draggedItem);
  createNestingBars(draggedItem);
  dropTarget.appendChild(draggedItem);
});

dragContainer.addEventListener("dragend", (e) => {
  e.stopPropagation();
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
  draggedItem.removeAttribute("data-temp-id");
});

// Trash container event listeners
trashContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.opacity = trashHoverOpacity;
});

trashContainer.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.opacity = trashDefaultOpacity;
});

trashContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.opacity = trashDefaultOpacity;
  const dropTarget = document.querySelector(".trash");
  console.log("droptarget ", dropTarget);
  const draggedItem = document.querySelector('[data-temp-id="temporary_id"]');
  draggedItem.remove();
});

/**
 * Creates custom html element.
 * @param {string} type - The HTML element type.
 * @param {string} className - The element's class name.
 * @param {Object} [attributes={}] - An optional key-value of element
 * attributes.
 */
function createCustomElement(elementType, className, attributes = {}) {
  const newElement = document.createElement(elementType);
  newElement.classList.add(className);
  Object.keys(attributes).forEach((key) => {
    newElement.setAttribute(key, attributes[key]);
  });
  return newElement;
}

// Nesting Logic Functions
function updateNestingLevel(dropTargetNestingLevel, draggedItem) {
  console.log("dropTargetNestingLevel:", dropTargetNestingLevel);
  console.log("draggedItem:", draggedItem);

  const newNestingLevel =
    dropTargetNestingLevel >= 0 ? parseInt(dropTargetNestingLevel) + 1 : 0;
  console.log("newNestingLevel:", newNestingLevel);

  draggedItem.dataset.nestingLevel = newNestingLevel;

  if (draggedItem.getAttribute("class") === "folder") {
    const children = Array.from(
      draggedItem.querySelector(".children").children,
    );
    console.log("children:", children);

    children.forEach((child) => {
      console.log("Updating child:", child);
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
    depthBars.innerHTML = "│";
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

  nested.innerHTML = parseInt(draggedItem.dataset.nestingLevel) > 0 ? "├─" : "";

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

// Buttons event listeners
function addButtonClickListener(id, type) {
  document
    .getElementById(id)
    .addEventListener("click", () => createContainer(type));
}

function handleClear() {
  const dragContainer = document.getElementById("drag-container");
  const trashContainer = document.querySelector(".trash");

  Array.from(dragContainer.children).forEach((child) => {
    if (child !== trashContainer) {
      child.remove();
    }
  });
}

function createFileSystem(zip, parent, basePath = "") {
  const folderName = parent.querySelector(".folder-name").getAttribute("name");
  const folderPath = basePath === "" ? folderName : `${basePath}/${folderName}`;

  zip.folder(folderPath);

  const children = Array.from(parent.querySelector(".children").children);
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
  const zip = new JSZip();
  const dragContainer = document.getElementById("drag-container");
  const rootElement = dragContainer.querySelector(".folder");

  if (!rootElement) {
    alert("Root folder is missing");
    return;
  }

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

document.addEventListener("DOMContentLoaded", () => {
  addButtonClickListener("addFolder", "folder");
  addButtonClickListener("addFile", "file");
});
