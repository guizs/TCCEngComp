document.addEventListener("DOMContentLoaded", function() {

    var downloadReportBtn = document.getElementById("downloadReportBtn");
   
    var reportModal = document.getElementById("reportModal");
    var closeBtn = document.getElementsByClassName("close")[0];

    downloadReportBtn.onclick = function() {
        reportModal.style.display = "block";
    }

    closeBtn.onclick = function() {
        reportModal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == reportModal) {
            reportModal.style.display = "none";
        }
    }

   
});