if (!sessionStorage.getItem("schoolAdmin") && !location.pathname.endsWith("index.html") && location.pathname !== "/") location.href = "index.html";
document.querySelectorAll(".sidebar nav a").forEach(a => { if (a.dataset.page === location.pathname.split("/").pop().replace(".html","")) a.classList.add("active"); });
const todayEl = document.getElementById("today"); if (todayEl) todayEl.textContent = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
document.getElementById("logout")?.addEventListener("click",()=>{sessionStorage.removeItem("schoolAdmin");location.href="index.html"});
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
function toast(message,isError=false){const el=document.getElementById("toast");if(!el)return;el.textContent=message;el.style.background=isError?"#a83d48":"#18233c";el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
async function api(url,options={}){const res=await fetch(url,{headers:{"Content-Type":"application/json"},...options});const data=await res.json();if(!res.ok)throw new Error(data.error||"Something went wrong");return data}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateText(value){return value?new Date(value).toLocaleDateString("en-IN"):"—"}