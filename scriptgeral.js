// Armazena o nome do usuário no local storage para exibição na interface
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
        console.error('Nenhum usuário logado.');
    }
}

function exibirNomeUsuario() {
    const userLogadoRef = firebase.database().ref('userlogado'); // Referência à tabela userLogado

    // Busca o nome diretamente de userLogado
    userLogadoRef.once('value').then((snapshot) => {
        const usuario = snapshot.val();
        if (usuario && usuario.nome) {
            // Atualiza o nome do usuário no span
            document.getElementById('usernameSpan').textContent = `Olá, ${usuario.nome}`;
        } else {
            // Reseta o span se o campo nome estiver vazio ou não existir
            document.getElementById('usernameSpan').textContent = 'Olá, ';
        }
    }).catch((error) => {
        console.error('Erro ao buscar o nome do usuário logado:', error);
        // Mensagem padrão em caso de erro
        document.getElementById('usernameSpan').textContent = 'Olá, ';
    });
}

// Chama a função para exibir o nome ao carregar a página
window.onload = () => {
    exibirNomeUsuario(); // Busca o nome e atualiza o span
};


// Armazena o nome do usuário no local storage ao logar e remove ao deslogar
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        armazenarUsuarioNoLocalStorage();
    } else {
        localStorage.removeItem('nomeUsuario');
        exibirNomeUsuario();
    }
});

// Força o recarregamento da página se carregada a partir do cache do navegador
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// Realiza o login e configura redirecionamento para a página inicial
function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const loader = document.getElementById("loader");

    firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(response => {
        loader.style.visibility = "visible";

        setTimeout(() => {
            window.location.href = "inicial.html";
            
            // Substitui o estado atual para prevenir o acesso à tela de login
            history.replaceState(null, null, "inicial.html");
            
            // Previne o uso do botão voltar redirecionando para a mesma página
            window.addEventListener('popstate', function(event) {
                history.pushState(null, null, window.location.href);
            });
        }, 3000);
    })
    .catch(error => {
        alert(getErrorMessage(error));
    });
}