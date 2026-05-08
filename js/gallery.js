const galleryData = {
    'time_corridor': {
        title: 'Time Corridor',
        items: [
            { img: 'assets/time_corridor.png', title: 'Echoes of 1956', desc: 'The foundational years of the Chengdu Institute of Geology, captured in a blend of historic and modern visages.' }
        ]
    },
    'earth_symphony': {
        title: 'Earth Symphony',
        items: [
            { img: 'assets/earth_symphony.png', title: 'Microscopic Landscapes', desc: 'A polarized light micrograph of a rock thin section, revealing the hidden beauty of geological formations.' }
        ]
    },
    'interdisciplinary_artscape': {
        title: 'Interdisciplinary Artscape',
        items: [
            { img: 'assets/interdisciplinary_artscape.png', title: 'Data Nexus', desc: 'A 3D visualization representing the interconnectedness of modern scientific disciplines at CDUT.' }
        ]
    },
    'cdut_weather': {
        title: 'CDUT Weather',
        items: [
            { img: 'assets/cdut_weather.png', title: 'Autumn Tranquility', desc: 'The golden hues of autumn blanket the campus, providing a serene environment for academic pursuit.' }
        ]
    },
    'future_visions': {
        title: 'Future Visions',
        items: [
            { img: 'assets/future_visions.png', title: 'Campus of Tomorrow', desc: 'A conceptual vision of a sustainable, technologically advanced CDUT campus in the future.' }
        ]
    }
};

let galleryInitialized = false;

window.initGallery = function() {
    if (galleryInitialized) return;
    
    const galleryContent = document.getElementById('gallery-content');
    
    // Generate HTML for halls
    Object.keys(galleryData).forEach((key, index) => {
        const hallData = galleryData[key];
        const hallDiv = document.createElement('div');
        hallDiv.className = `hall ${index === 0 ? 'active' : ''}`;
        hallDiv.id = key;
        
        const title = document.createElement('h2');
        title.className = 'hall-title';
        title.textContent = hallData.title;
        hallDiv.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'art-grid';
        
        hallData.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'art-card';
            card.onclick = () => openModal(item.img, item.title, item.desc);
            
            card.innerHTML = `
                <img src="${item.img}" alt="${item.title}" loading="lazy">
                <div class="art-info">
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        
        hallDiv.appendChild(grid);
        galleryContent.appendChild(hallDiv);
    });

    // Setup navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const targetId = e.target.getAttribute('data-target');
            document.querySelectorAll('.hall').forEach(hall => {
                hall.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Modal setup
    const modal = document.getElementById("image-modal");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = function() { 
        modal.style.display = "none";
    }

    // Close on outside click
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    galleryInitialized = true;
};

function openModal(imgSrc, title, desc) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const captionText = document.getElementById("caption");
    
    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = `<strong>${title}</strong><br><br>${desc}`;
}
