/* Simple localStorage "backend" for demo */
const Storage = {
  usersKey: 'gf_users_v1',
  currentKey: 'gf_current_v1',
  getUsers(){ return JSON.parse(localStorage.getItem(this.usersKey)||'{}') },
  saveUsers(s){ localStorage.setItem(this.usersKey, JSON.stringify(s)) },
  getCurrent(){ return JSON.parse(localStorage.getItem(this.currentKey)||'null') },
  setCurrent(u){ localStorage.setItem(this.currentKey, JSON.stringify(u)) },
  logout(){ localStorage.removeItem(this.currentKey) }
};

function notify(type, text){ if(window.Noty) new Noty({type, text, timeout:2000, theme:'sunset'}).show(); else alert(text); }

function registerUser({name, phone, pass}){
  const users = Storage.getUsers();
  if(!phone || !pass) return {ok:false, msg:'Preencha telefone e senha.'};
  if(users[phone]) return {ok:false, msg:'Telefone já cadastrado.'};
  users[phone] = {name:name||('Usuário '+(Object.keys(users).length+1)), phone, pass, balance:20.00, referrals:[], invested:0, withdrawn:0, lastCheckin:null};
  Storage.saveUsers(users);
  Storage.setCurrent(users[phone]);
  return {ok:true, user:users[phone]};
}

function loginUser({phone, pass}){
  const users = Storage.getUsers();
  const u = users[phone];
  if(!u) return {ok:false, msg:'Usuário não encontrado.'};
  if(u.pass !== pass) return {ok:false, msg:'Senha incorreta.'};
  Storage.setCurrent(u);
  return {ok:true, user:u};
}

function persistCurrent(user){
  const users = Storage.getUsers();
  users[user.phone] = user;
  Storage.saveUsers(users);
  Storage.setCurrent(user);
}

/* Check-in diário */
function doCheckin(){
  const cur = Storage.getCurrent();
  if(!cur) { notify('error','Faça login primeiro.'); return; }
  const today = new Date().toISOString().slice(0,10);
  if(cur.lastCheckin === today){ notify('error','Já fez check-in hoje.'); return; }
  cur.balance = +(cur.balance + 1).toFixed(2);
  cur.lastCheckin = today;
  persistCurrent(cur);
  notify('success','Check-in efetuado! +R$1,00');
  renderDashboard();
}

/* Depósito / Saque (simulados) */
function doDeposit(amount){
  const cur = Storage.getCurrent();
  if(!cur) { notify('error','Faça login primeiro.'); return; }
  amount = Number(amount);
  if(!amount || amount<=0) return notify('error','Valor inválido');
  cur.balance = +(cur.balance + amount).toFixed(2);
  cur.invested += amount;
  persistCurrent(cur);
  notify('success', 'Depósito simulado: R$' + amount.toFixed(2));
  renderDashboard();
}

function doWithdraw(amount){
  const cur = Storage.getCurrent();
  if(!cur) { notify('error','Faça login primeiro.'); return; }
  amount = Number(amount);
  if(!amount || amount<=0) return notify('error','Valor inválido');
  if(amount > cur.balance) return notify('error','Saldo insuficiente');
  const fee = +(amount * 0.12).toFixed(2);
  const net = +(amount - fee).toFixed(2);
  cur.balance = +(cur.balance - amount).toFixed(2);
  cur.withdrawn += net;
  persistCurrent(cur);
  notify('success', `Saque enviado (taxa R$${fee.toFixed(2)}). Valor líquido: R$${net.toFixed(2)}`);
  renderDashboard();
}

/* Render dashboard (na página index.html) */
function renderDashboard(){
  const cur = Storage.getCurrent();
  const container = document.getElementById('dashboard-root');
  if(!container) return;
  if(!cur){
    container.innerHTML = `<div class="card-farm center"><div><p class="text-lg font-bold" style="color:var(--amber-900)">Você não está logado</p><p class="small-muted">Use o botão abaixo para entrar ou criar conta.</p><div style="height:8px"></div><a class="btn-farm" href="login.html">Login / Registrar</a></div></div>`;
    return;
  }
  container.innerHTML = `
    <div class="card-farm mb-4">
      <div class="text-center">
        <div class="text-sm small-muted">Saldo</div>
        <div style="font-size:2rem;font-weight:800;color:var(--amber-900)">R$ <span id="dash-balance">${cur.balance.toFixed(2)}</span></div>
      </div>
      <div style="margin-top:.8rem;border-top:2px solid var(--amber-900);padding-top:.6rem">
        <div style="display:flex;justify-content:space-between"><span class="small-muted">Comissões de equipe</span><strong>R$0.00</strong></div>
        <div style="display:flex;justify-content:space-between"><span class="small-muted">Retirada total</span><strong>R$${cur.withdrawn.toFixed(2)}</strong></div>
      </div>
    </div>
    <div class="card-farm mb-4">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:56px;height:56px;border-radius:999px;background:linear-gradient(45deg,#fbbf24,#d97706);display:flex;align-items:center;justify-content:center;font-size:1.5rem">💡</div>
        <div style="flex:1">
          <div style="font-weight:700;color:var(--amber-900)">Produtos de Investimento</div>
          <div class="small-muted">Renda a ganhar</div>
        </div>
      </div>
    </div>
    <div class="card-farm mb-4">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="tool-btn" onclick="openDeposit()">💰 Depositar</button>
        <button class="tool-btn" onclick="openWithdraw()">💵 Sacar</button>
        <button class="tool-btn" onclick="doCheckin()">🏙️ Check-in</button>
        <button class="tool-btn" onclick="openShare()">🤝 Compartilhar</button>
      </div>
    </div>
    <div class="card-farm mb-4">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="small-muted">Usuário</div>
          <div style="font-weight:700;color:var(--amber-900)">${cur.name} (${cur.phone})</div>
        </div>
        <div style="text-align:right">
          <div><a href="profile.html" class="small-muted">Ver perfil</a></div>
          <div style="height:6px"></div>
          <button class="btn-farm" onclick="logout()"><span>Logout</span></button>
        </div>
      </div>
    </div>
  `;
}

function openDeposit(){ const v = prompt('Valor a depositar (apenas simulação)', '50'); if(v) doDeposit(v); }
function openWithdraw(){ const v = prompt('Valor a sacar', '50'); if(v) doWithdraw(v); }
function openShare(){ const cur = Storage.getCurrent(); if(!cur) return notify('error','Faça login primeiro'); const link = location.origin + '/?ref=' + encodeURIComponent(cur.phone); navigator.clipboard?.writeText(link).then(()=>notify('success','Link copiado: ' + link)).catch(()=>notify('success','Link: ' + link)); }
function logout(){ Storage.logout(); notify('success','Desconectado'); renderDashboard(); }

document.addEventListener('DOMContentLoaded', ()=>{
  renderDashboard();
  const btnCheckin = document.getElementById('btn-checkin');
  if(btnCheckin) btnCheckin.addEventListener('click', doCheckin);
});
