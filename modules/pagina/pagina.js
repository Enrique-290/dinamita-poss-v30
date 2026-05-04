(function(){
  const btn = document.getElementById("pagina-go-3");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const nav = document.querySelector('#menu button[data-module="pagina3"]');
    if(nav) nav.click();
  });
})();
