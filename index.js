document.addEventListener("DOMContentLoaded", () => {
  const dragContainer = document.getElementById("drag-container");
  const trashContainer = document.querySelector(".trash");

  function createElementWithClassAndAttribute(
    elementType,
    className,
    attribute = {},
  ) {
    const newElement = document.createElement(elementType);
    newElement.classList.add(className);
    Object.keys(attribute).forEach((key) => {
      newElement.setAttribute(key, attribute[key]);
    });
    return newElement;
  }

  function createContainer(type) {
    const newContainer = createElementWithClassAndAttribute("span", type, {
      "data-nesting-level": 0,
      draggable: true,
    });

    const containerContent = createElementWithClassAndAttribute(
      "div",
      "content",
    );
    const nestingBars = createElementWithClassAndAttribute(
      "div",
      "nesting-bars",
    );
    const depth = createElementWithClassAndAttribute("div", "depth");
    const nested = createElementWithClassAndAttribute("div", "nested");
    nestingBars.appendChild(depth);
    nestingBars.appendChild(nested);

    const dragHandle = createElementWithClassAndAttribute("i", "drag-handle");
    dragHandle.innerHTML = `<i class="fas fa-${type}"></i>`;

    const nameInput = createElementWithClassAndAttribute(
      "input",
      `${type}-name`,
    );
    nameInput.classList.add(`${type}-name`);
    nameInput.value = `new_${type}`;
    nameInput.name = nameInput.value;
    nameInput.addEventListener("input", () => {
      newContainer.draggable = false;
      nameInput.name = nameInput.value.trim();
      nameInput.value = nameInput.value.replace(/\s+/g, " ");
    });
    nameInput.addEventListener("blur", () => {
      newContainer.draggable = true;
      nameInput.value = nameInput.value.trim();
      if (nameInput.name === "") {
        nameInput.name = `new_${type}`;
        nameInput.value = nameInput.name;
      }
      nameInput.setSelectionRange(
        nameInput.value.length,
        nameInput.value.length,
      );
      const siblings = Array.from(
        nameInput.parentElement.parentElement.parentElement.children,
      ).filter((child) => {
        return (
          child !== nameInput.parentElement.parentElement &&
          child.querySelector("input") &&
          child.querySelector("input") !== nameInput
        );
      });

      const currentName = nameInput.value;

      const hasDuplicateSibling = siblings.some((sibling) => {
        const siblingInput = sibling.querySelector("input");
        return (
          siblingInput.value !== `new_${type}` &&
          siblingInput.value === currentName
        );
      });

      if (hasDuplicateSibling) {
        alert(`A ${type} with the same name already exists`);
        nameInput.name = `new_${type}`;
        nameInput.value = nameInput.name;
      }
    });

    const nestItems = createElementWithClassAndAttribute("div", "children");

    containerContent.appendChild(nestingBars);
    containerContent.appendChild(dragHandle);
    containerContent.appendChild(nameInput);
    newContainer.appendChild(containerContent);
    if (type === "folder") {
      newContainer.appendChild(nestItems);
    }
    dragContainer.appendChild(newContainer);

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

      nested.innerHTML =
        parseInt(draggedItem.dataset.nestingLevel) > 0 ? "├─" : "";

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

    // For testing/debugging
    newContainer.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("current target:", e.currentTarget);
      console.log("nesting level :", e.currentTarget.dataset.nestingLevel);
    });

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
      const tempId = e.dataTransfer.getData("text/plain");
      const draggedItem = document.querySelector(`[data-temp-id="${tempId}"]`);
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

        const checkForDuplicateName = (children, itemName, itemType) => {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childName = child.querySelector("input").getAttribute("name");

            if (itemName === childName && itemName !== `new_${itemType}`) {
              alert(`A ${itemType} with that name already exists`);
              return true;
            }
          }
          return false;
        };

        const handleDropAction = (target, nestingLevel, item) => {
          updateNestingLevel(nestingLevel, item);
          createNestingBars(item);
          target.appendChild(item);
        };

        const isDuplicate = checkForDuplicateName(
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
      const tempId = e.dataTransfer.getData("text/plain");
      const draggedItem = document.querySelector(`[data-temp-id="${tempId}"]`);
      if (draggedItem) {
        draggedItem.removeAttribute("data-temp-id");
      }
    });

    // Drag container event listeners
    dragContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    dragContainer.addEventListener("drop", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const dropTarget = document.getElementById("drag-container");
      console.log("droptarget ", dropTarget);
      const tempId = e.dataTransfer.getData("text/plain");
      const draggedItem = document.querySelector(`[data-temp-id="${tempId}"]`);

      updateNestingLevel(-1, draggedItem);
      createNestingBars(draggedItem);
      dropTarget.appendChild(draggedItem);
    });

    dragContainer.addEventListener("dragend", (e) => {
      e.stopPropagation();
      const tempId = e.dataTransfer.getData("text/plain");
      const draggedItem = document.querySelector(`[data-temp-id="${tempId}"]`);
      draggedItem.removeAttribute("data-temp-id");
    });

    // Trash event listeners
    trashContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.style.opacity = 1;
    });

    trashContainer.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.style.opacity = 0.5;
    });

    trashContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.style.opacity = 0.5;
      const dropTarget = document.querySelector(".trash");
      console.log("droptarget ", dropTarget);
      const tempId = e.dataTransfer.getData("text/plain");
      const draggedItem = document.querySelector(`[data-temp-id="${tempId}"]`);
      draggedItem.remove();
    });
  }

  // Buttons event listeners
  function addButtonClickListener(id, type) {
    document
      .getElementById(id)
      .addEventListener("click", () => createContainer(type));
  }

  addButtonClickListener("addFolder", "folder");
  addButtonClickListener("addFile", "file");

  function handleClear() {
    const dragContainer = document.getElementById("drag-container");
    const trashContainer = document.querySelector(".trash");

    Array.from(dragContainer.children).forEach((child) => {
      if (child !== trashContainer) {
        child.remove();
      }
    });
  }

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.id === "clear") {
      handleClear();
    }
  });
});
