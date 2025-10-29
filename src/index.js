import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../dist/public/css/main.css';

let texto = document.getElementById("frase");
let palabra = document.getElementById("palabra");
let reemplazo = document.getElementById("reemplazo");
let btn_buscar = document.getElementById("btn_busqueda");
let resultadoOriginal = document.getElementById("resultado_original");
let resultadoResaltado = document.getElementById("resultado_encontrado");
let resultadoReemplazado = document.getElementById("resultado_reemplazado");
let contador = document.getElementById("contador");

btn_buscar.addEventListener("click", () => {
    let fraseOriginal = texto.value;             
    let palabraBuscada = palabra.value.trim();
    let nuevaPalabra = reemplazo.value.trim();

    if (palabraBuscada === "") {
        contador.innerText = "Por favor, escribe una palabra a buscar.";
        resultadoOriginal.innerText = fraseOriginal;
        return;
    }

    fraseOriginal = fraseOriginal.replace(/\r?\n|\r/g, " ");

    let regex = new RegExp(`(${palabraBuscada})`, "gi");

    let coincidencias = fraseOriginal.match(regex);
    let total = coincidencias ? coincidencias.length : 0;

    let fraseResaltada = fraseOriginal.replace(regex, `<span class="bg-warning fw-bold">$1</span>`);

    let fraseReemplazada = nuevaPalabra
        ? fraseOriginal.replace(regex, `<span class="text-success fw-bold">${nuevaPalabra}</span>`)
        : "(No se ingresó palabra de reemplazo)";

    resultadoOriginal.innerText = fraseOriginal;
    resultadoResaltado.innerHTML = fraseResaltada;
    resultadoReemplazado.innerHTML = fraseReemplazada;
    contador.innerText = `Se encontró ${total} coincidencia(s).`;
});
