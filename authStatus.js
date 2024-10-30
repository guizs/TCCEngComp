// Função para verificar o status de autenticação ao carregar a página
function verificarStatusUsuario() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Usuário autenticado, sessão válida
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
            // Redireciona para a página de login se não autenticado
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = "index.html";
        }
    });
}

// Executa verificações ao carregar a página inicial
document.addEventListener("DOMContentLoaded", function() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (usuarioLogado === 'true') {
        verificarStatusUsuario();
    } else {
        // Redireciona para login se não autenticado na sessão da aba
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

// Função de logout manual, caso necessário
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