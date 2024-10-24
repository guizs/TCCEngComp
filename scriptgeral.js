function armazenarUsuarioNoLocalStorage() {
    const user = firebase.auth().currentUser;
    if (user) {
        const uid = user.uid;
        const db = firebase.database();
        const usuariosRef = db.ref('usuarios/' + uid);
        usuariosRef.once('value').then((snapshot) => {
            const nome = snapshot.val().nome;
            if (nome) {
                localStorage.setItem('nomeUsuario', nome); // Armazena o nome no local storage
                exibirNomeUsuario(); // Exibe o nome do usuário na interface
            }
        }).catch((error) => {
            console.error('Erro ao recuperar o nome do usuário:', error);
        });
    } else {
        console.error('Nenhum usuário logado.');
    }
}

function exibirNomeUsuario() {
    const nomeUsuario = localStorage.getItem('nomeUsuario');
    if (nomeUsuario) {
        document.getElementById('usernameSpan').textContent = `Olá, ${nomeUsuario}`;
    } else {
        document.getElementById('usernameSpan').textContent = 'Olá, '; // Reseta o conteúdo quando não há usuário logado
    }
}

// Chama a função para armazenar o nome do usuário durante o login
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        armazenarUsuarioNoLocalStorage();
    } else {
        localStorage.removeItem('nomeUsuario'); // Remove o nome do usuário do local storage quando deslogado
        exibirNomeUsuario(); // Reseta a exibição do nome
    }
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) { // Verifica se a página foi carregada do cache
        window.location.reload(); // Recarrega a página
    }
});

function login(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const loader = document.getElementById("loader"); // Pega o elemento do loader

    firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(response => {
        loader.style.visibility = "visible";

        setTimeout(() => {
            // Redireciona para a página inicial
            window.location.href = "inicial.html";
            
            // Substitui o estado atual no histórico (tela de login) para que não possa ser acessada novamente
            history.replaceState(null, null, "inicial.html");
            
            // Previne o uso do botão voltar
            window.addEventListener('popstate', function(event) {
                // Quando o usuário tentar voltar, ele é redirecionado para a mesma página
                history.pushState(null, null, window.location.href);
            });
        }, 3000);
    })
    .catch(error => {
        alert(getErrorMessage(error));
    });
}