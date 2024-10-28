document.getElementById("cadastrarFreezer").addEventListener("click", function() {
    const marca = document.getElementById("marcaInput").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");

    // Limpa classes anteriores e conteúdo
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    // Verifica se os campos estão preenchidos
    if (!marca || isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Por favor, preencha todos os campos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Verifica os valores de temperatura
    if (tempMin > tempMax) {
        messageElem.textContent = "A temperatura mínima não pode ser maior que a temperatura máxima.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Mostra pop-up de confirmação
    document.getElementById("popupConfirm").style.display = "flex";
});

function cadastrarFreezer() {
    const marca = document.getElementById("marcaInput").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");

    const ref = firebase.database().ref("freezers");
    const counterRef = firebase.database().ref("counter");

    counterRef.transaction(function(currentCounter) {
        return (currentCounter || 0) + 1;
    }, function(error, committed, snapshot) {
        if (error) {
            messageElem.textContent = "Erro ao atualizar o contador: Contate o suporte.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        } else if (committed) {
            const newId = snapshot.val();
            const brandCode = marca.substring(0, 4).toUpperCase();
            const fullId = brandCode + newId;

            ref.child(newId).set({
                id: fullId,
                marca: marca,
                tempMin: tempMin,
                tempMax: tempMax,
                dataCadastro: new Date().toISOString()
            }, function(error) {
                if (error) {
                    messageElem.textContent = "Erro ao cadastrar o freezer: Contate o suporte.";
                    messageElem.parentElement.classList.add("error");
                    setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                } else {
                    messageElem.textContent = "Freezer cadastrado com sucesso.";
                    messageElem.parentElement.classList.add("success");
                    setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                    //LimpacamposCadastro();
                }
                setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
            });
        }
    });
}

function LimpacamposCadastro() {
    document.getElementById('marcaInput').value = '';
    document.getElementById('tempMinInput').value = '';
    document.getElementById('tempMaxInput').value = '';
}

document.getElementById("confirmYes").addEventListener("click", function() {
    document.getElementById("popupConfirm").style.display = "none";
    cadastrarFreezer(); // Chama a função de cadastrar freezer
});

document.getElementById("confirmNo").addEventListener("click", function() {
    document.getElementById("popupConfirm").style.display = "none"; // Apenas esconde o pop-up
});


document.getElementById("alterarFreezer").addEventListener("click", function() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    // Limpa classes anteriores e conteúdo
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    // Verifica se os campos estão preenchidos
    if (!inputId || !marca || isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Por favor, preencha todos os campos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Verifica os valores de temperatura
    if (tempMin > tempMax) {
        messageElem.textContent = "A temperatura mínima não pode ser maior que a temperatura máxima.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Mostra pop-up de confirmação
    document.getElementById("popupConfirm").style.display = "flex";
});

function alterarFreezer() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    // Verifica se os valores de temperatura são válidos números
    if (isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Erro: Temperaturas devem ser números válidos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        let found = false;

        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().id === inputId) {
                found = true;
                const fullId = childSnapshot.val().id; // Mantém o ID completo original

                ref.child(childSnapshot.key).update({
                    id: fullId,
                    marca: marca,
                    tempMin: tempMin,
                    tempMax: tempMax,
                    dataAlteracao: new Date().toISOString()
                }, function(error) {
                    if (error) {
                        messageElem.textContent = "Erro ao alterar o freezer: Contate o suporte.";
                        messageElem.parentElement.classList.add("error");
                        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                    } else {
                        messageElem.textContent = "Freezer alterado com sucesso.";
                        messageElem.parentElement.classList.add("success");
                        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                        LimpacamposAlterar();
                    }
                    setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
                });
            }
        });

        if (!found) {
            messageElem.textContent = "ID não encontrado: Verifique o ID informado.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        }
    });
}

document.getElementById("confirmYes").addEventListener("click", function() {
    document.getElementById("popupConfirm").style.display = "none";
    alterarFreezer(); // Chama a função de alterar freezer
});


function LimpacamposAlterar() {
    document.getElementById('ID').value = '';
    document.getElementById('marca-alterar').value = '';
    document.getElementById('tempMin-alterar').value = '';
    document.getElementById('tempMax-alterar').value = '';
}


document.getElementById("ID").addEventListener("input", function() {
    const inputId = document.getElementById("ID").value;
    const messageElem = document.querySelector(".message-alterar p");

    // Limpa mensagens anteriores
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    if (!inputId) {
        // Limpa o campo marca se o ID estiver vazio
        document.getElementById("marca-alterar").value = '';
        return;
    }

    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        let found = false;

        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().id === inputId) {
                found = true;
                const marca = childSnapshot.val().marca;
                document.getElementById("marca-alterar").value = marca;

                // Limpa mensagem se encontrada a marca
                messageElem.textContent = "";
                messageElem.parentElement.classList.remove("success", "error", "tremor");
            }
        });

        if (!found) {
            messageElem.textContent = "ID não encontrado: Verifique o ID informado.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        }
    });
});

function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function carregarFreezers() {
    const ref = firebase.database().ref("freezers");
    ref.once("value", function(snapshot) {
        const tableBody = document.querySelector("#freezersTable tbody");
        tableBody.innerHTML = ""; // Limpa qualquer conteúdo existente na tabela

        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${data.id}</td>
                <td>${data.marca}</td>
                <td>${data.tempMin} °C</td>
                <td>${data.tempMax} °C</td>
                <td>${formatarData(data.dataCadastro)}</td>
                <td>${data.dataAlteracao ? formatarData(data.dataAlteracao) : 'N/A'}</td>
            `;

            tableBody.appendChild(row);
        });
    });
}

// Carrega os freezers ao carregar a página
window.onload = carregarFreezers;

window.onload = function() {
    carregarFreezers();
};
