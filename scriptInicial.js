document.addEventListener("DOMContentLoaded", function() {
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementsByClassName("close")[0];
    const selectAllCheckbox = document.getElementById("selectAll");
    const freezerSelect = document.getElementById("freezerSelect");
    const usernameSpan = document.getElementById("usernameSpan");
    const cadastrarLink = document.getElementById("cadastrarLink");

    // Função para verificar se o usuário possui acesso gerencial
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

    // Função para exibir o nome do usuário
    function exibirNomeUsuario() {
        const nomeUsuario = localStorage.getItem('nomeUsuario') || '';
        usernameSpan.textContent = nomeUsuario;
    }

    // Chama a função para exibir o nome e verificar gerência no login
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

    // Outros manipuladores de eventos e lógica do modal
    downloadReportBtn.onclick = function() {
        reportModal.style.display = "block";
        setTimeout(function() {
            reportModal.classList.add("show");
        }, 10);
    };

    closeBtn.onclick = function() {
        reportModal.classList.remove("show");
        setTimeout(function() {
            reportModal.style.display = "none";
        }, 500);
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
        const options = freezerSelect && freezerSelect.options;
        for (let i = 0; i < options.length; i++) {
            options[i].selected = selectAllCheckbox.checked;
        }
    });
});