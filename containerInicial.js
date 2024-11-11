let clickInterval;
let isPaused = false;
let pauseTimeout;
let currentCardIndex = 0; // Controla o índice do card atual
let notificationCount = 0; // Contador de notificações
let notificationMessages = []; // Armazena as mensagens de notificação

function carregarFreezersStatus() {
    const statusContainer = document.querySelector(".status-freezer-inner");
    const freezersLigadosElement = document.getElementById("freezers-ligados");
    const freezersDesligadosElement = document.getElementById("freezers-desligados");

    if (!statusContainer) {
        console.error("Elemento .status-freezer-inner não encontrado.");
        return;
    }

    statusContainer.innerHTML = ""; // Limpa o conteúdo existente
    notificationMessages = []; // Limpa as mensagens de notificação a cada carregamento

    const statusRef = firebase.database().ref("freezers_status");
    statusRef.once("value", function(snapshot) {
        let countLigados = 0;
        let countDesligados = 0;

        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();

            // Criação do elemento 'freezer-card'
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

            // Atualiza contadores de freezers ligados e desligados e gera notificações
            if (statusColor === "gray") {
                countDesligados++;
                notificationMessages.push(`Freezer ${freezer.id} está desligado.`);
            } else if (statusColor === "red") {
                const tempAtual = parseFloat(freezer.temperaturaAtual);
                const tempMin = parseFloat(freezer.tempMin);
                const tempMax = parseFloat(freezer.tempMax);
                const diff = tempAtual < tempMin ? (tempMin - tempAtual) : (tempAtual - tempMax);
                notificationMessages.push(`Freezer ${freezer.id} está fora do intervalo! Temp: ${tempAtual}°C, desvio: ${Math.round(diff)}°C.`);
                countLigados++;
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

            // Adiciona o evento de clique ao card para carregar detalhes, destacar o card e pausar o carrossel
            freezerCard.addEventListener("click", function() {
                // Remove a classe ativa de todos os cards antes de adicionar ao card clicado
                document.querySelectorAll(".freezer-card").forEach(c => c.classList.remove("active"));
                
                // Adiciona a classe ativa ao card atual
                freezerCard.classList.add("active");
                
                // Carrega os detalhes do freezer específico
                carregarDetalhesFreezer(freezer.id);
                
                // Pausa o clique automático por 10 minutos
                pausarEContinuarClickAutomatico();
            });

            statusContainer.appendChild(freezerCard);
        });

        // Atualiza os elementos HTML com a quantidade de freezers ligados e desligados
        freezersLigadosElement.textContent = countLigados;
        freezersDesligadosElement.textContent = countDesligados;

        // Atualiza as notificações
        notificationCount = notificationMessages.length;
        showNotifications(notificationCount);
        updateNotificationPopup();

        iniciarClickAutomatico();
    });
}

// Carrega detalhes do freezer específico selecionado
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

function iniciarClickAutomatico() {
    // Certifica-se de que existem cards antes de iniciar o clique automático
    const freezerCards = document.querySelectorAll(".freezer-card");
    if (freezerCards.length === 0) {
        console.warn("Nenhum card encontrado. Tentando novamente em 1 segundo...");
        setTimeout(iniciarClickAutomatico, 1000); // Tenta novamente após 1 segundo
        return;
    }

    simularCliqueNoCard();

    clickInterval = setInterval(() => {
        console.log("Executando intervalo de 3 segundos"); // Mantém o intervalo reduzido para testes
        if (!isPaused) {
            simularCliqueNoCard();
        }
    }, 30000);
}


// Função para simular o clique em um card específico
function simularCliqueNoCard() {
    const freezerCards = document.querySelectorAll(".freezer-card");

    if (freezerCards.length > 0) {
        freezerCards.forEach(c => c.classList.remove("active"));
        
        const card = freezerCards[currentCardIndex];
        card.classList.add("active");
        console.log("Exibindo card index:", currentCardIndex); // Verifica o índice atual
        
        carregarDetalhesFreezer(card.querySelector("span").textContent); // Chama diretamente a função para carregar detalhes
        
        currentCardIndex = (currentCardIndex + 1) % freezerCards.length;
    }
}



// Função para pausar o clique automático por 10 minutos e depois retomar
function pausarEContinuarClickAutomatico() {
    clearInterval(clickInterval); // Pausa o clique automático
    isPaused = true;

    // Limpa o timeout anterior, caso exista
    if (pauseTimeout) clearTimeout(pauseTimeout);

    // Define a pausa de 10 minutos
    pauseTimeout = setTimeout(() => {
        isPaused = false;
        iniciarClickAutomatico(); // Retoma o clique automático após 10 minutos
    }, 600000); // 10 minutos em milissegundos
}

// Adiciona o evento de clique para pausar o clique automático
document.addEventListener("click", (event) => {
    if (event.target.closest(".freezer-card")) {
        pausarEContinuarClickAutomatico();
    }
});

// Inicia o clique automático ao carregar a página
window.onload = function() {
    carregarFreezersStatus(); // Chama apenas carregarFreezersStatus
};

document.getElementById('notificationIcon').addEventListener('click', function() {
    const popup = document.getElementById('notificationPopup');
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
});

// Ocultar o popup se clicar fora dele
document.addEventListener('click', function(event) {
    const notificationIcon = document.getElementById('notificationIcon');
    const popup = document.getElementById('notificationPopup');
    if (!notificationIcon.contains(event.target) && !popup.contains(event.target)) {
        popup.style.display = 'none';
    }
});

function updateNotificationPopup() {
    const popup = document.getElementById('notificationPopup');
    popup.innerHTML = ''; // Limpa as notificações antigas

    if (notificationMessages.length > 0) {
        notificationMessages.forEach((message) => {
            const p = document.createElement("p");
            p.textContent = message;
            popup.appendChild(p);
        });
    } else {
        const p = document.createElement("p");
        p.textContent = "Não há mensagens pendentes.";
        popup.appendChild(p);
    }
}

// Exibir o contador de notificações e o tremor do ícone
function showNotifications(count) {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationCountElement = document.getElementById('notificationCount');
    
    if (count > 0) {
        notificationIcon.classList.add('has-notifications'); // Ativa o tremor
        notificationCountElement.textContent = count; // Define o número de notificações
        notificationCountElement.style.display = 'inline'; // Exibe a bolinha
    } else {
        notificationIcon.classList.remove('has-notifications'); // Remove o tremor
        notificationCountElement.style.display = 'none'; // Oculta a bolinha
    }
}
