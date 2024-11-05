// Verifica a URL e define logout no banco de dados, exceto para páginas específicas
function atualizarLogoutSeNecessario() {
    const paginasExcecao = ["cadastrofreezer.html", "cadastrouser.html", "inicial.html"];
    const paginaAtual = window.location.pathname.split("/").pop();

    if (!paginasExcecao.includes(paginaAtual)) {
        firebase.database().ref('userlogado').set({
            nome: "",
            bool: false
        }).catch(error => {
            console.error("Erro ao atualizar logout no banco de dados:", error);
        });
    }
}

// Verifica o status de autenticação ao carregar a página
function verificarStatusUsuario() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            sessionStorage.setItem('usuarioLogado', 'true');
            firebase.database().ref('userlogado/bool').once('value')
            .then(snapshot => {
                const conectado = snapshot.val();
                if (!conectado) {
                    document.body.innerHTML = "<h1>Usuário desconectado</h1>";
                    document.body.style.backgroundColor = "#fff";
                    window.location.href = "index.html";
                }
            })
            .catch(error => {
                console.error("Erro ao verificar o status do usuário:", error);
            });
        } else {
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = "index.html";
        }
    });
}

// Executa verificações ao carregar a página inicial
document.addEventListener("DOMContentLoaded", function() {
    atualizarLogoutSeNecessario();
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (usuarioLogado === 'true') {
        verificarStatusUsuario();
    } else {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                sessionStorage.setItem('usuarioLogado', 'true');
                verificarStatusUsuario();
            } else {
                sessionStorage.removeItem('usuarioLogado');
                window.location.href = "index.html";
            }
        });
    }
});

// Executa logout manualmente, se necessário
function logout() {
    firebase.database().ref('userlogado').set({
        nome: "",
        bool: false
    }).then(() => {
        return firebase.auth().signOut();
    }).then(() => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = "index.html";
    }).catch(error => {
        console.error("Erro ao fazer logout:", error);
    });
}