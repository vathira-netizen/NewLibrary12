/* scripts.js - shared logic with mock data and client-side flows */

/* ---------- Mock Data ---------- */
const MOCK_BOOKS = [
  {id:1,title:"Foundations of Algorithms",author:"C. Levit",category:"Computer Science",language:"English",available:true,cover:"https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop"},

  // 🔄 Updated Book 1
  {id:2,title:"Cognitive Science Explained",author:"L. Hartman",category:"Psychology",language:"English",available:true,cover:"https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=800&auto=format&fit=crop"},

  // 🔄 Updated Book 2
  {id:3,title:"Principles of Engineering Physics",author:"R. Mehta",category:"Engineering",language:"English",available:true,cover:"https://images.unsplash.com/photo-1509223197845-458d87318791?q=80&w=800&auto=format&fit=crop"},

  {id:4,title:"Kannada Literature",author:"S. Rao",category:"Literature",language:"Kannada",available:true,cover:"https://images.unsplash.com/photo-1518933165971-611dbc9c412d?q=80&w=800&auto=format&fit=crop"},

  {id:5,title:"Data Science Essentials",author:"C. Levit",category:"Computer Science",language:"English",available:false,cover:"https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop"},

  {id:6,title:"Introduction to Sociology",author:"B. Nair",category:"Social Sciences",language:"English",available:true,cover:"https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop"}
];

const COMPLAINT_TYPES = ["Book damaged","Missing book","Account issue","Reservation issue","WiFi / Facilities","Other"];

/* ---------- Utilities ---------- */
function $(sel){return document.querySelector(sel)}
function $all(sel){return Array.from(document.querySelectorAll(sel))}

function requireLogin(redirectTo='login.html'){
  const user = JSON.parse(localStorage.getItem('cul_user')||'null');
  if(!user){ window.location.href = redirectTo; return null; }
  return user;
}

/* ---------- Auth: login / logout ---------- */
function handleLoginForm(){
  const form = $('#loginForm');
  if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim().toLowerCase();
    const pass = form.querySelector('#password').value.trim();

    if(!email.endsWith('@christuniversity.in')){
      alert('Please sign in with your @christuniversity.in email.');
      return;
    }
    // create simple user object
    const user = {
      name: name || email.split('@')[0],
      email, phone:"", password:pass || "changeme",
      issuedHistory: [ /* sample issued books IDs */ 2,5 ],
      activeIssues: [2], // currently borrowed
      pendingReturns: [2],
      pendingFine: 0,
      favorites:{books: [5], authors:["C. Levit"]},
      reservations: []
    };
    localStorage.setItem('cul_user', JSON.stringify(user));
    // persist mock books if not present
    if(!localStorage.getItem('cul_books')) localStorage.setItem('cul_books', JSON.stringify(MOCK_BOOKS));
    window.location.href = 'dashboard.html';
  });
}

/* ---------- Dashboard rendering ---------- */
function renderHeader(user){
  const e = document.createElement('div');
  e.className = 'header card';
  e.innerHTML = `
    <div style="display:flex;align-items:center;gap:18px">
      <div class="brand">CHRIST UNIVERSITY<br><span style="font-weight:800">LIBRARY</span></div>
    </div>
    <div class="nav">
      <a href="dashboard.html">Home</a>
      <a href="profile.html">Profile</a>
      <a href="complaint.html">Complaints</a>
      <a href="room_booking.html" class="cta">Book Room</a>
      <a href="#" id="logoutBtn" style="margin-left:8px">Logout</a>
    </div>
  `;
  document.body.prepend(e);
  $('#logoutBtn')?.addEventListener('click', e=>{
    e.preventDefault();
    localStorage.removeItem('cul_user');
    window.location.href = 'login.html';
  });
}

function loadBooksFromStore(){
  const b = JSON.parse(localStorage.getItem('cul_books')||'[]');
  return b;
}

function saveBooksToStore(books){
  localStorage.setItem('cul_books', JSON.stringify(books));
}

function loadDashboard(){
  const user = requireLogin();
  if(!user) return;
  renderHeader(user);

  const books = loadBooksFromStore();

  // stats
  $('#statIssued').textContent = user.issuedHistory?.length || 0;
  $('#statActive').textContent = user.activeIssues?.length || 0;
  $('#statReturns').textContent = user.pendingReturns?.length || 0;
  $('#statFine').textContent = `₹ ${user.pendingFine || 0}`;

  // favorites
  const favBooks = (user.favorites?.books||[]).map(id=>books.find(b=>b.id===id)).filter(Boolean);
  const favAuthors = user.favorites?.authors || [];
  const favList = $('#favList');
  favList.innerHTML = '';
  favBooks.forEach(b=>{
    const d = document.createElement('div'); d.className='card'; d.style.marginBottom='10px';
    d.innerHTML = `<strong>${b.title}</strong><div class="small-muted">${b.author}</div>`;
    favList.appendChild(d);
  });
  if(favAuthors.length){
    const block = document.createElement('div'); block.className='card';
    block.style.marginTop='12px';
    block.innerHTML = `<strong>Favorite authors</strong><div class="small-muted">${favAuthors.join(', ')}</div>`;
    favList.appendChild(block);
  }

  // render book cards
  function renderBooks(list){
    const out = $('#booksGrid'); out.innerHTML = '';
    if(list.length===0){ out.innerHTML = '<div class="card">No books found.</div>'; return; }
    list.forEach(book=>{
      const card = document.createElement('div'); card.className='card book-card';
      card.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" />
        <h3>${book.title}</h3>
        <p>${book.author} • ${book.category} • ${book.language}</p>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btnFav" data-id="${book.id}" style="background:#fff;border:1px solid #ddd;color:var(--navy)">❤ Fav</button>
          <button class="btnReserve" data-id="${book.id}" style="background:${book.available? 'var(--gold)':'#999'};color:${book.available? '#fff':'#eee'}">${book.available? 'Reserve':'Unavailable'}</button>
          <span style="margin-left:auto;color:#7a7f86;font-weight:600">${book.available? 'Available':'Checked out'}</span>
        </div>
      `;
      out.appendChild(card);
    });
    // attach handlers
    $all('.btnFav').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        toggleFavoriteBook(id);
        loadDashboard(); // refresh
      });
    });
    $all('.btnReserve').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        if(!btn.textContent.includes('Reserve') && !btn.textContent.includes('Unavailable') && !btn.textContent.includes('Available')){}
        // go to reserve flow via modal or page. We'll show a confirm prompt for demo
        const book = books.find(b=>b.id===id);
        if(book.available){
          if(confirm(`Reserve "${book.title}" now?`)){
            reserveBook(id);
            alert('Reserved! Check "Reservations" on your profile.');
            loadDashboard();
          }
        } else {
          alert('This book is currently unavailable for reservation.');
        }
      });
    });
  }

  renderBooks(books);

  // search & filter
  $('#searchBtn')?.addEventListener('click', ()=>{
    const q = $('#searchInput').value.trim().toLowerCase();
    const cat = $('#filterCategory').value;
    const auth = $('#filterAuthor').value;
    const lang = $('#filterLanguage').value;
    let list = books.slice();
    if(q) list = list.filter(b=> (b.title + ' ' + b.author).toLowerCase().includes(q));
    if(cat) list = list.filter(b=>b.category===cat);
    if(auth) list = list.filter(b=>b.author===auth);
    if(lang) list = list.filter(b=>b.language===lang);
    renderBooks(list);
  });

  // populate filters
  const cats = [...new Set(books.map(b=>b.category))];
  const authors = [...new Set(books.map(b=>b.author))];
  const langs = [...new Set(books.map(b=>b.language))];
  $('#filterCategory').innerHTML = `<option value="">All categories</option>` + cats.map(c=>`<option>${c}</option>`).join('');
  $('#filterAuthor').innerHTML = `<option value="">All authors</option>` + authors.map(a=>`<option>${a}</option>`).join('');
  $('#filterLanguage').innerHTML = `<option value="">All languages</option>` + langs.map(l=>`<option>${l}</option>`).join('');
}

/* ---------- Favorites & Reserve ---------- */
function toggleFavoriteBook(bookId){
  const user = JSON.parse(localStorage.getItem('cul_user')||'null'); if(!user) return;
  user.favorites = user.favorites || {books:[], authors:[]};
  const idx = user.favorites.books.indexOf(bookId);
  if(idx>=0) user.favorites.books.splice(idx,1);
  else user.favorites.books.push(bookId);
  localStorage.setItem('cul_user', JSON.stringify(user));
}

function reserveBook(bookId){
  const user = JSON.parse(localStorage.getItem('cul_user')||'null'); if(!user) return;
  const books = loadBooksFromStore();
  const b = books.find(x=>x.id===bookId);
  if(!b) return;
  if(!b.available) return false;
  // mark as reserved (simple)
  b.available = false;
  saveBooksToStore(books);
  user.reservations = user.reservations || [];
  user.reservations.push({bookId, date: new Date().toISOString()});
  localStorage.setItem('cul_user', JSON.stringify(user));
  return true;
}

/* ---------- Profile: edit ---------- */
function loadProfilePage(){
  const user = requireLogin();
  if(!user) return;
  renderHeader(user);
  $('#profileName').value = user.name || '';
  $('#profileEmail').value = user.email || '';
  $('#profilePhone').value = user.phone || '';
  $('#profilePassword').value = user.password || '';
  $('#saveProfileBtn').addEventListener('click', ()=>{
    const email = $('#profileEmail').value.trim().toLowerCase();
    if(!email.endsWith('@christuniversity.in')){ alert('Email must be @christuniversity.in'); return; }
    user.name = $('#profileName').value.trim();
    user.email = email;
    user.phone = $('#profilePhone').value.trim();
    user.password = $('#profilePassword').value.trim();
    localStorage.setItem('cul_user', JSON.stringify(user));
    alert('Profile updated');
    window.location.href = 'dashboard.html';
  });
}

/* ---------- Complaint ---------- */
function loadComplaintPage(){
  const user = requireLogin();
  if(!user) return;
  renderHeader(user);
  const sel = $('#complaintType');
  sel.innerHTML = COMPLAINT_TYPES.map(t=>`<option>${t}</option>`).join('');
  sel.addEventListener('change', ()=>{
    if(sel.value === 'Other') $('#otherComplaintRow').style.display = 'block';
    else $('#otherComplaintRow').style.display = 'none';
  });
  $('#submitComplaint').addEventListener('click', ()=>{
    const type = sel.value;
    const other = $('#otherComplaint').value.trim();
    const details = $('#complaintDetails').value.trim();
    if(!type) { alert('Pick a complaint type'); return; }
    const complaints = JSON.parse(localStorage.getItem('cul_complaints')||'[]');
    complaints.push({
      id:Date.now(),
      user: user.email,
      type: type === 'Other' ? other || 'Other' : type,
      details,
      date: new Date().toISOString()
    });
    localStorage.setItem('cul_complaints', JSON.stringify(complaints));
    alert('Complaint registered. Thank you.');
    $('#complaintDetails').value=''; $('#otherComplaint').value=''; sel.selectedIndex = 0; $('#otherComplaintRow').style.display='none';
  });
}

/* ---------- Room booking ---------- */
function loadRoomBookingPage(){
  const user = requireLogin();
  if(!user) return;
  renderHeader(user);
  $('#bookRoomBtn').addEventListener('click', ()=>{
    const date = $('#roomDate').value;
    const from = $('#roomFrom').value;
    const to = $('#roomTo').value;
    const people = Number($('#roomPeople').value || 1);
    if(!date || !from || !to){ alert('Select date and time'); return; }
    if(people < 1){ alert('Enter valid number of people'); return; }
    const bookings = JSON.parse(localStorage.getItem('cul_room_bookings')||'[]');
    bookings.push({id:Date.now(), user: user.email, date, from, to, people});
    localStorage.setItem('cul_room_bookings', JSON.stringify(bookings));
    alert('Room booked successfully.');
    // clear form
    $('#roomDate').value=''; $('#roomFrom').value=''; $('#roomTo').value=''; $('#roomPeople').value='';
  });
}

/* ---------- Init handlers for pages ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  if(window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/')){
    handleLoginForm();
  }
  if(window.location.pathname.endsWith('dashboard.html')){
    loadDashboard();
  }
  if(window.location.pathname.endsWith('profile.html')){
    loadProfilePage();
  }
  if(window.location.pathname.endsWith('complaint.html')){
    loadComplaintPage();
  }
  if(window.location.pathname.endsWith('room_booking.html')){
    loadRoomBookingPage();
  }
});
