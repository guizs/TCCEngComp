document.addEventListener("DOMContentLoaded", function() {
    const links = document.querySelectorAll("a");
    const loader = document.getElementById("loader");
    const loginForm = document.getElementById("LoginForm");

    links.forEach(link => {
        link.addEventListener("click", function(event) {
            loader.style.visibility = "visible";
        });
    });

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const username = document.getElementById("usuario").value;
            const password = document.getElementById("senha").value;
            const validUsername = "desenvolvedor";
            const validPassword = "123459876";

            if (username === validUsername && password === validPassword) {
                localStorage.setItem("username", username); // Armazena o nome do usuário no local storage
                loader.style.visibility = "visible"; // Mostra o loader
                setTimeout(function() {
                    window.location.href = "inicial.html"; // Redireciona após 1 segundo
                }, 1000);
            } else {
                alert("Usuário ou senha incorretos.");
            }
        });
    }
});