document.addEventListener("DOMContentLoaded", function() {
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const reportModal = document.getElementById("reportModal");
    const closeBtn = document.getElementsByClassName("close")[0];
    const selectAllCheckbox = document.getElementById("selectAll");
    const freezerSelect = document.getElementById("freezerSelect");
    const usernameSpan = document.getElementById("usernameSpan");
    const cadastrarLink = document.getElementById("cadastrarLink"); // ID do link "cadastrar"

    // Função para verificar se o usuário tem gerencia true
    function verificarGerencia() {
        const user = firebase.auth().currentUser;
        if (user) {
            const userId = user.uid;
            firebase.database().ref('usuarios/' + userId).once('value')
            .then(snapshot => {
                const usuario = snapshot.val();
                // Verifica se o usuário tem o campo 'gerencia' igual a true
                if (usuario && usuario.gerencia) {
                    cadastrarLink.style.display = 'block'; // Mostra o link
                } else {
                    cadastrarLink.style.display = 'none'; // Esconde o link
                }
            })
            .catch(error => {
                console.error('Erro ao verificar o usuário:', error);
                cadastrarLink.style.display = 'none'; // Esconde o link em caso de erro
            });
        } else {
            cadastrarLink.style.display = 'none'; // Esconde o link se não houver usuário logado
        }
    }

    // Função para armazenar e exibir o nome do usuário
    function armazenarUsuarioNoLocalStorage() {
        const user = firebase.auth().currentUser;
        if (user) {
            const uid = user.uid;
            const db = firebase.database();
            const usuariosRef = db.ref('usuarios/' + uid);
            usuariosRef.once('value').then((snapshot) => {
                const nome = snapshot.val().nome;
                if (nome) {
                    localStorage.setItem('nomeUsuario', nome);
                    exibirNomeUsuario();
                }
            }).catch((error) => {
                console.error('Erro ao recuperar o nome do usuário:', error);
            });
        } else {
            localStorage.removeItem('nomeUsuario');
            exibirNomeUsuario();
        }
    }

    // Chama a função para armazenar o nome do usuário durante o login
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            armazenarUsuarioNoLocalStorage();
            verificarGerencia(); // Verifica o campo gerencia após o login
        } else {
            cadastrarLink.style.display = 'none'; // Esconde o link se não houver usuário logado
            exibirNomeUsuario();
        }
    });

    // Login do usuário
    function login(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const loader = document.getElementById("loader"); // Pega o elemento do loader

        loader.style.visibility = "visible"; // Mostra o loader

        firebase.auth().signInWithEmailAndPassword(email, senha)
        .then(response => {
            // O login foi bem-sucedido, não há necessidade de verificar o status aqui
            loader.style.visibility = "hidden"; // Esconde o loader
            // O redirecionamento e a verificação de gerencia acontecem no onAuthStateChanged
        })
        .catch(error => {
            loader.style.visibility = "hidden"; // Esconde o loader em caso de erro
            alert(getErrorMessage(error));
        });
    }

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