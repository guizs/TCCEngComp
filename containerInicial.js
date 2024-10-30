function carregarFreezersStatus() {
    const statusContainer = document.querySelector(".status-freezer-inner");

    if (!statusContainer) {
        console.error("Elemento .status-freezer-inner não encontrado.");
        return;
    }

    statusContainer.innerHTML = ""; // Limpa qualquer conteúdo existente

    const statusRef = firebase.database().ref("freezers_status");
    statusRef.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();

            // Cria o elemento 'freezer-card'
            const freezerCard = document.createElement("div");
            freezerCard.classList.add("freezer-card");

            let statusColor = "gray";
            if (freezer.temperaturaAtual !== "" && freezer.temperaturaAtual !== undefined) {
                const tempAtual = parseFloat(freezer.temperaturaAtual);
                const tempMin = parseFloat(freezer.tempMin);
                const tempMax = parseFloat(freezer.tempMax);

                if (!isNaN(tempAtual) && !isNaN(tempMin) && !isNaN(tempMax)) {
                    statusColor = (tempAtual >= tempMin && tempAtual <= tempMax) ? "green" : "red";
                }
            }

            freezerCard.innerHTML = `
                <div>
                    <div class="status-indicator ${statusColor}"></div>
                    <span>${freezer.id}</span>
                </div>
                <div class="temperature">${freezer.temperaturaAtual ? `${freezer.temperaturaAtual}°C` : "N/A"}</div>
            `;

            freezerCard.addEventListener("click", function() {
                carregarDetalhesFreezer(freezer.id);
            });

            statusContainer.appendChild(freezerCard);
        });
    });
}

function carregarDetalhesFreezer(freezerId) {
    const detailsSection = document.querySelector(".details-section");

    const freezerRef = firebase.database().ref(`freezers_status/${freezerId}`);
    freezerRef.once("value", function(snapshot) {
        const freezerData = snapshot.val();
        if (freezerData) {
            const temperaturaAtual = parseFloat(freezerData.temperaturaAtual);
            const tempMin = parseFloat(freezerData.tempMin);
            const tempMax = parseFloat(freezerData.tempMax);

            detailsSection.querySelector(".temperature").innerHTML = `<b> Temperatura atual > ${temperaturaAtual}°C </b>`;
            detailsSection.querySelector(".details-content p").innerHTML = `
                Min ${tempMin}°C - Max ${tempMax}°C - 
                <b>${(temperaturaAtual >= tempMin && temperaturaAtual <= tempMax) ? "Tudo sob controle!" : "Atenção: fora do intervalo!"}</b>
            `;
        }
    });

    const historicoRef = firebase.database().ref(`historico_freezers/${freezerId}`);
    historicoRef.once("value", function(snapshot) {
        const tbody = detailsSection.querySelector("table tbody");
        tbody.innerHTML = ""; // Limpa linhas antigas

        snapshot.forEach(function(childSnapshot) {
            const historico = childSnapshot.val();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${historico.temperatura}°C</td>
                <td>${historico.id}</td>
                <td>${historico.data}</td>
                <td>${historico.hora}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

window.onload = function() {
    carregarFreezersStatus();
};