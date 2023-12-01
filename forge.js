document.addEventListener("DOMContentLoaded", () => {
  const forgeButton = document.getElementById("forge");

  // Forge button listener
  forgeButton.addEventListener("click", () => {
    const dragContainer = document.getElementById("drag-container");
    const rootElement = dragContainer.querySelector(".folder");
    const zip = new JSZip();

    if (!rootElement) {
      alert("Root folder is missing");
    } else if (rootElement.querySelector(".children").children.length < 2) {
      alert("Root folder must have at least two elements");
    } else {
      const rootName = rootElement
        .querySelector(".folder-name")
        .getAttribute("name");

      createFileSystem(zip, rootElement);

      zip.generateAsync({ type: "blob" }).then((blob) => {
        const zipName = `${rootName}.zip`;
        saveAs(blob, zipName);
      });
    }
  });

  // File system creation logic
  function createFileSystem(zip, $parent, basePath = "") {
    const folderName = $parent
      .querySelector(".folder-name")
      .getAttribute("name");
    const folderPath =
      basePath === "" ? folderName : `${basePath}/${folderName}`;

    zip.folder(folderPath);

    const children = Array.from($parent.querySelector(".children").children);
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
});
