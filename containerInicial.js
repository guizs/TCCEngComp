let clickInterval;
let isPaused = false;
let pauseTimeout;
let currentCardIndex = 0;
let notificationCount = 0;
let notificationMessages = []; 

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
    const freezersRef = firebase.database().ref("freezers");

    // Primeiro, busca os dados de dataCadastro da tabela 'freezers'
    freezersRef.once("value", function(freezersSnapshot) {
        const dataCadastroMap = {}; // Mapeia IDs de freezers para dataCadastro

        // Armazena dataCadastro por ID
        freezersSnapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            dataCadastroMap[freezer.id] = freezer.dataCadastro || "Data não disponível";
        });

        // Em seguida, busca os dados de status da tabela 'freezers_status'
        statusRef.once("value", function(snapshot) {
            let countLigados = 0;
            let countDesligados = 0;

            // Criação de um array para armazenar os freezers temporariamente
            const freezersArray = [];

            snapshot.forEach(function(childSnapshot) {
                const freezer = childSnapshot.val();

                // Associa dataCadastro obtida da tabela 'freezers' usando o ID do freezer
                freezer.dataCadastro = dataCadastroMap[freezer.id] || "Data não disponível";

                // Adiciona logs para verificar o valor de dataCadastro de cada freezer
                console.log(`Freezer ID: ${freezer.id}, dataCadastro: ${freezer.dataCadastro}`);

                // Adiciona cada freezer ao array para ordenação posterior
                freezersArray.push(freezer);
            });

            // Ordena o array de freezers por status
            freezersArray.sort((a, b) => {
                const colorOrder = { "gray": 1, "red": 2, "yellow": 3, "green": 4 };
                const statusA = determineStatusColor(a);
                const statusB = determineStatusColor(b);
                return colorOrder[statusA] - colorOrder[statusB];
            });

            // Depois de ordenar, cria os elementos de card
            freezersArray.forEach(freezer => {
                const freezerCard = document.createElement("div");
                freezerCard.classList.add("freezer-card");
                freezerCard.dataset.dataCadastro = freezer.dataCadastro;

                let statusColor = determineStatusColor(freezer);

                // Atualiza contadores de freezers ligados e desligados e gera notificações
                if (statusColor === "gray") {
                    countDesligados++;
                    notificationMessages.push(`Freezer ${freezer.id} está desligado.`);
                } else if (statusColor === "red") {
                    notificationMessages.push(`Freezer ${freezer.id} está fora do intervalo!`);
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

                freezerCard.addEventListener("click", function() {
                    document.querySelectorAll(".freezer-card").forEach(c => c.classList.remove("active"));
                    freezerCard.classList.add("active");
                    carregarDetalhesFreezer(freezer.id);
                    pausarEContinuarClickAutomatico();
                });

                statusContainer.appendChild(freezerCard);
            });

            freezersLigadosElement.textContent = countLigados;
            freezersDesligadosElement.textContent = countDesligados;

            notificationCount = notificationMessages.length;
            showNotifications(notificationCount);
            updateNotificationPopup();
            iniciarClickAutomatico();
        });
    });
}

// Função auxiliar para determinar a cor do status
function determineStatusColor(freezer) {
    if (freezer.temperaturaAtual !== "" && freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null) {
        const tempAtual = parseFloat(freezer.temperaturaAtual);
        const tempMin = parseFloat(freezer.tempMin);
        const tempMax = parseFloat(freezer.tempMax);

        if (!isNaN(tempAtual) && !isNaN(tempMin) && !isNaN(tempMax)) {
            return (tempAtual >= tempMin && tempAtual <= tempMax) ? "green" : "red";
        }
    }
    return "gray"; // Freezer desligado por padrão
}

function carregarDetalhesFreezer(freezerId) {
    const detailsSection = document.querySelector(".details-section");

    // Verificação da existência de detailsSection
    if (!detailsSection) {
        console.error("Elemento .details-section não encontrado.");
        return;
    }

    // Exibe o ID do freezer selecionado na seção de detalhes
    detailsSection.querySelector(".details-header").innerText = `${freezerId} - Histórico`;

    // Referência ao freezer no Firebase
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

            // Referência para o histórico do freezer
            const historicoRef = firebase.database().ref(`freezers_historico/${freezerId}`);
            historicoRef.once("value", function(snapshot) {
                const tbody = detailsSection.querySelector("table tbody");

                // Verificação da existência do tbody
                if (!tbody) {
                    console.error("Elemento <tbody> não encontrado dentro de .details-section.");
                    return;
                }

                tbody.innerHTML = ""; // Limpa os registros antigos
                const historicoEntries = [];

                // Verificação de dados de temperatura, data e hora
                const temperaturaKeys = Object.keys(snapshot.child("temperatura").val() || {});
                const dataKeys = Object.keys(snapshot.child("data").val() || {});
                const horaKeys = Object.keys(snapshot.child("hora").val() || {});

                // Verifica se os arrays têm o mesmo tamanho para evitar inconsistências
                if (temperaturaKeys.length === dataKeys.length && dataKeys.length === horaKeys.length) {
                    temperaturaKeys.forEach(function(key) {
                        const temperatura = snapshot.child(`temperatura/${key}`).val() || "N/A";
                        const data = snapshot.child(`data/${key}`).val() || "N/A";
                        const hora = snapshot.child(`hora/${key}`).val() ? snapshot.child(`hora/${key}`).val().replace("h", ":") : "N/A";

                        historicoEntries.push({ temperatura, data, hora });
                    });
                } else {
                    console.warn(`Dados inconsistentes no histórico do freezer ${freezerId}`);
                }

                // Ordena do mais recente para o mais antigo
                historicoEntries.sort((a, b) => {
                    const dateTimeA = new Date(`${a.data} ${a.hora}`);
                    const dateTimeB = new Date(`${b.data} ${b.hora}`);
                    return dateTimeB - dateTimeA;
                });

                // Preenche o histórico no tbody
                historicoEntries.forEach((entry) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${entry.data}</td>
                        <td>${entry.hora}</td>
                        <td>${entry.temperatura}°C</td>
                        <td>${freezerId}</td>
                    `;

                    // Destaca as temperaturas fora do intervalo
                    if (entry.temperatura !== "N/A" && freezerData) {
                        const tempAtual = parseFloat(entry.temperatura);
                        const tempMin = parseFloat(freezerData.tempMin);
                        const tempMax = parseFloat(freezerData.tempMax);

                        if (!isNaN(tempAtual) && (tempAtual < tempMin || tempAtual > tempMax)) {
                            row.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
                        }
                    }

                    tbody.appendChild(row); // Adiciona a linha à tabela
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

// Adiciona eventos de alteração para filtro e ordenação
document.getElementById("filterSelect").addEventListener("change", () => {
    aplicarFiltro();
    aplicarOrdenacao(); // Reaplica a ordenação após o filtro
});

document.getElementById("sortSelect").addEventListener("change", () => {
    aplicarOrdenacao();
});

// Função para aplicar o filtro sem desalinhar os cards
function aplicarFiltro() {
    const filterValue = document.getElementById("filterSelect").value;
    const freezerCards = document.querySelectorAll(".freezer-card");

    freezerCards.forEach(card => {
        const statusIndicator = card.querySelector(".status-indicator");
        const statusColor = statusIndicator ? statusIndicator.classList[1] : "";

        if (filterValue === "all" || statusColor === filterValue) {
            // Exibe o card
            card.style.display = "flex";
        } else {
            // Oculta o card
            card.style.display = "none";
        }
    });
}

function aplicarOrdenacao() {
    const sortValue = document.getElementById("sortSelect").value;
    const freezerCards = Array.from(document.querySelectorAll(".freezer-card"));

    // Exibe o valor de dataCadastro antes da ordenação
    console.log("Antes da ordenação:", freezerCards.map(card => ({
        id: card.querySelector("span").textContent,
        dataCadastro: card.dataset.dataCadastro
    })));

    // Ordena a lista de cards temporariamente com base no valor selecionado
    switch (sortValue) {
        case "a-z":
            freezerCards.sort((a, b) => a.querySelector("span").textContent.localeCompare(b.querySelector("span").textContent));
            break;
        case "z-a":
            freezerCards.sort((a, b) => b.querySelector("span").textContent.localeCompare(a.querySelector("span").textContent));
            break;
        case "most-recent":
            freezerCards.sort((a, b) => new Date(b.dataset.dataCadastro) - new Date(a.dataset.dataCadastro));
            break;
        case "oldest":
            freezerCards.sort((a, b) => new Date(a.dataset.dataCadastro) - new Date(b.dataset.dataCadastro));
            break;
        case "temperature-asc":
            freezerCards.sort((a, b) => parseFloat(a.querySelector(".temperature").textContent) - parseFloat(b.querySelector(".temperature").textContent));
            break;
        case "temperature-desc":
            freezerCards.sort((a, b) => parseFloat(b.querySelector(".temperature").textContent) - parseFloat(a.querySelector(".temperature").textContent));
            break;
        case "status":
            const colorOrder = { "gray": 1, "red": 2, "yellow": 3, "green": 4 };
            freezerCards.sort((a, b) => colorOrder[a.querySelector(".status-indicator").classList[1]] - colorOrder[b.querySelector(".status-indicator").classList[1]]);
            break;
    }

    // Exibe o valor de dataCadastro após a ordenação
    console.log("Depois da ordenação:", freezerCards.map(card => ({
        id: card.querySelector("span").textContent,
        dataCadastro: card.dataset.dataCadastro
    })));

    // Aplica visualmente a ordem usando `order` (sem mexer na estrutura do DOM)
    freezerCards.forEach((card, index) => {
        card.style.order = index;
    });
}


// Chamadas dos filtros e ordenações ao carregar a página
window.onload = function() {
    carregarFreezersStatus();
    aplicarFiltro();
    aplicarOrdenacao();
};

