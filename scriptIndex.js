document.addEventListener("DOMContentLoaded", function() {
    const links = document.querySelectorAll("a");
    const loader = document.getElementById("loader");

    links.forEach(link => {
        link.addEventListener("click", function(event) {
            loader.style.visibility = "visible";
        });
    });
});

function login(){
    firebase.auth().signInWithEmailAndPassword("desenvolvedor@gmail.com", "123456789").then(Response => {
        console.log('sucess', Response)
    }).catch(error => {
        console.log('error', error)
    });
}
