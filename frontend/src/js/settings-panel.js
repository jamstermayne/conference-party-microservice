export async function renderSettings(mount){
  if(!mount) return;
  mount.innerHTML = `
    <section style="margin:24px">
      <h2 style="margin:0 0 14px">Settings</h2>
      <div class="vmeta">Theme: Blue/Purple (locked)</div>
      <div class="vmeta">Notifications: On</div>
      <div class="vmeta">Account: user@example.com</div>
    </section>`;
}
export default { renderSettings };
