document.addEventListener("DOMContentLoaded", function() {
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementsByClassName("close")[0];
    const selectAllCheckbox = document.getElementById("selectAll");
    const freezerSelect = document.getElementById("freezerSelect");
    const usernameSpan = document.getElementById("usernameSpan");
    const cadastrarLink = document.getElementById("cadastrarLink");

    // Verifica se o usuário tem permissão gerencial e ajusta o link de cadastro
    function verificarGerencia() {
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.database().ref('usuarios/' + user.uid).once('value')
            .then(snapshot => {
                const usuario = snapshot.val();
                cadastrarLink.style.display = usuario?.gerencia ? 'block' : 'none';
            })
            .catch(error => {
                console.error('Erro ao verificar o usuário:', error);
                cadastrarLink.style.display = 'none';
            });
        } else {
            cadastrarLink.style.display = 'none';
        }
    }

    // Exibe o nome do usuário armazenado no localStorage
    function exibirNomeUsuario() {
        const nomeUsuario = localStorage.getItem('nomeUsuario') || '';
        usernameSpan.textContent = nomeUsuario;
    }

    // Inicializa a exibição do nome e a verificação de gerência após o login
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            firebase.database().ref('usuarios/' + user.uid).once('value').then((snapshot) => {
                const nome = snapshot.val().nome;
                localStorage.setItem('nomeUsuario', nome);
                exibirNomeUsuario();
                verificarGerencia();
            });
        } else {
            exibirNomeUsuario();
            cadastrarLink.style.display = 'none';
        }
    });

    // Exibe o modal de relatório ao clicar no botão de download
    downloadReportBtn.onclick = function() {
        reportModal.style.display = "block";
        setTimeout(function() {
            reportModal.classList.add("show");
        }, 10);
    };

    // Fecha o modal de relatório ao clicar no botão de fechar
    closeBtn.onclick = function() {
        reportModal.classList.remove("show");
        setTimeout(function() {
            reportModal.style.display = "none";
        }, 500);
    };

    // Fecha o modal se o clique for fora dele
    window.onclick = function(event) {
        if (event.target == reportModal) {
            reportModal.classList.remove("show");
            setTimeout(function() {
                reportModal.style.display = "none";
            }, 500);
        }
    };

    // Seleciona ou desmarca todas as opções no seletor de freezers ao clicar em "Selecionar todos"
    selectAllCheckbox.addEventListener("change", function() {
        const options = freezerSelect && freezerSelect.options;
        for (let i = 0; i < options.length; i++) {
            options[i].selected = selectAllCheckbox.checked;
        }
    });
});
