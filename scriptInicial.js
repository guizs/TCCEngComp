document.addEventListener("DOMContentLoaded", function() {
    var downloadReportBtn = document.getElementById("downloadReportBtn");
    var reportModal = document.getElementById("reportModal");
    var closeBtn = document.getElementsByClassName("close")[0];
    var selectAllCheckbox = document.getElementById("selectAll");
    var freezerSelect = document.getElementById("freezerSelect");
    var usernameSpan = document.getElementById("usernameSpan");

    downloadReportBtn.onclick = function() {
        reportModal.style.display = "block";
        setTimeout(function() {
            reportModal.classList.add("show");
        }, 10); // Pequeno atraso para permitir que o display: block aplique antes da transição
    };

    closeBtn.onclick = function() {
        reportModal.classList.remove("show");
        setTimeout(function() {
            reportModal.style.display = "none";
        }, 500); // Tempo para permitir que a transição de opacidade termine antes de esconder
    };

    window.onclick = function(event) {
        if (event.target == reportModal) {
            reportModal.classList.remove("show");
            setTimeout(function() {
                reportModal.style.display = "none";
            }, 500);
        }
    };

    selectAllCheckbox.addEventListener("change", function() {
        var options = freezerSelect && freezerSelect.options;
        for (var i = 0; i < options.length; i++) {
            options[i].selected = selectAllCheckbox.checked;
        }
    });
});