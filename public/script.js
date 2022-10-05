document.querySelectorAll(".toggleVisibilityButton").forEach((e) =>
  e.addEventListener("click", function (button) {
    let tableTwo = document.querySelector(".displaytable");
    if (tableTwo.style.display === "none") tableTwo.style.display = "table";
    else tableTwo.style.display = "none";
  })
);
