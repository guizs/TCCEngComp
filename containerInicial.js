// Função para carregar o status dos freezers e atualizá-los dinamicamente
function carregarFreezersStatus() {
    const statusContainer = document.querySelector(".status-freezer-inner");
    const freezersLigadosElement = document.getElementById("freezers-ligados");
    const freezersDesligadosElement = document.getElementById("freezers-desligados");

    if (!statusContainer) {
        console.error("Elemento .status-freezer-inner não encontrado.");
        return;
    }

    statusContainer.innerHTML = ""; // Limpa qualquer conteúdo existente

    const statusRef = firebase.database().ref("freezers_status");
    statusRef.once("value", function(snapshot) {
        let countLigados = 0;
        let countDesligados = 0;

        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();

            // Cria o elemento 'freezer-card'
            const freezerCard = document.createElement("div");
            freezerCard.classList.add("freezer-card");

            let statusColor = "gray";
            if (freezer.temperaturaAtual !== "" && freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null) {
                const tempAtual = parseFloat(freezer.temperaturaAtual);
                const tempMin = parseFloat(freezer.tempMin);
                const tempMax = parseFloat(freezer.tempMax);

                if (!isNaN(tempAtual) && !isNaN(tempMin) && !isNaN(tempMax)) {
                    statusColor = (tempAtual >= tempMin && tempAtual <= tempMax) ? "green" : "red";
                }
            }

            // Conta os freezers ligados e desligados com base na cor do status
            if (statusColor === "gray") {
                countDesligados++;
            } else {
                countLigados++;
            }

            freezerCard.innerHTML = `
                <div>
                    <div class="status-indicator ${statusColor}"></div>
                    <span>${freezer.id}</span>
                </div>
                <div class="temperature">${freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null && freezer.temperaturaAtual !== "" ? `${freezer.temperaturaAtual}°C` : "N/A"}</div>
            `;

            freezerCard.addEventListener("click", function() {
                carregarDetalhesFreezer(freezer.id);
            });

            statusContainer.appendChild(freezerCard);
        });

        // Atualiza os elementos no HTML com as quantidades de freezers ligados e desligados
        freezersLigadosElement.textContent = countLigados;
        freezersDesligadosElement.textContent = countDesligados;
    });
}

// Função para carregar detalhes do freezer específico
function carregarDetalhesFreezer(freezerId) {
    const detailsSection = document.querySelector(".details-section");
    detailsSection.querySelector(".details-header").innerText = `${freezerId} - Histórico`;

    firebase.database().ref("freezers_status").once("value", function(snapshot) {
        let freezerData = null;
        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            if (data.id === freezerId) {
                freezerData = data;
            }
        });

        if (freezerData) {
            const temperaturaAtual = (freezerData.temperaturaAtual !== undefined && freezerData.temperaturaAtual !== null && freezerData.temperaturaAtual !== "") ? parseFloat(freezerData.temperaturaAtual) : "N/A";
            const tempMin = (freezerData.tempMin !== undefined && freezerData.tempMin !== null && freezerData.tempMin !== "") ? parseFloat(freezerData.tempMin) : "N/A";
            const tempMax = (freezerData.tempMax !== undefined && freezerData.tempMax !== null && freezerData.tempMax !== "") ? parseFloat(freezerData.tempMax) : "N/A";

            const tempElement = detailsSection.querySelector(".temperature");
            if (tempElement) {
                tempElement.innerHTML = `<b> Temperatura atual: ${temperaturaAtual}°C </b>`;
            }

            let statusMessage = "Verifique os alertas";
            if (temperaturaAtual !== "N/A" && tempMin !== "N/A" && tempMax !== "N/A") {
                if (temperaturaAtual < tempMin) {
                    statusMessage = "Temperatura abaixo do esperado, verifique os alertas";
                } else if (temperaturaAtual > tempMax) {
                    statusMessage = "Temperatura acima do esperado, verifique os alertas";
                } else {
                    statusMessage = "Tudo sob controle";
                }
            }

            const detailsContentP = detailsSection.querySelector(".details-content p");
            if (detailsContentP) {
                detailsContentP.innerHTML = `
                    Min ${tempMin}°C - Max ${tempMax}°C - 
                    <b>${statusMessage}</b>
                `;
            }

            const historicoRef = firebase.database().ref(`freezers_historico/${freezerId}`);
            historicoRef.once("value", function(snapshot) {
                const tbody = detailsSection.querySelector("table tbody");
                tbody.innerHTML = "";

                const historicoEntries = [];

                snapshot.child("temperatura").forEach(function(childSnapshot) {
                    const key = childSnapshot.key;
                    const temperatura = (childSnapshot.val() !== undefined && childSnapshot.val() !== null && childSnapshot.val() !== "") ? childSnapshot.val() : "N/A";
                    const data = snapshot.child(`data/${key}`).val() || "N/A";
                    const hora = snapshot.child(`hora/${key}`).val() ? snapshot.child(`hora/${key}`).val().replace("h", ":") : "N/A";

                    historicoEntries.push({ temperatura, data, hora });
                });

                historicoEntries.sort((a, b) => {
                    const dateTimeA = new Date(`${a.data} ${a.hora}`);
                    const dateTimeB = new Date(`${b.data} ${b.hora}`);
                    return dateTimeB - dateTimeA;
                });

                historicoEntries.forEach((entry) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${entry.data}</td>
                        <td>${entry.hora}</td>
                        <td>${entry.temperatura}°C</td>
                        <td>${freezerId}</td>
                    `;

                    if (entry.temperatura !== "N/A" && freezerData) {
                        const tempAtual = parseFloat(entry.temperatura);
                        const tempMin = parseFloat(freezerData.tempMin);
                        const tempMax = parseFloat(freezerData.tempMax);

                        if (!isNaN(tempAtual) && (tempAtual < tempMin || tempAtual > tempMax)) {
                            row.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
                        }
                    }

                    tbody.appendChild(row);
                });
            });
        } else {
            console.error(`Dados do freezer ${freezerId} não encontrados no Firebase.`);
        }
    });
}

window.onload = function() {
    carregarFreezersStatus();
};