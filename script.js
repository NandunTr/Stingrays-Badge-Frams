const fileInput = document.getElementById('fileInput');
const cameraBtn = document.getElementById('cameraBtn');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const framesList = document.getElementById('framesList');
const placeholder = document.getElementById('placeholder');
const canvasArea = document.querySelector('.canvas-area');

// State
let currentImage = null;
let currentFrame = null;
let headerImage = null; // New header branding
let imageX = 0;
let imageY = 0;
let imageScale = 1;

// Available frames
// Uses global constants from assets.js
const frames = [
    { id: 1, src: IMG_STARFISH, name: 'Starfish' },
    { id: 2, src: IMG_OTTER, name: 'Otter' },
    { id: 3, src: IMG_PENGUIN, name: 'Penguin' },
    { id: 4, src: IMG_SHARK, name: 'Shark' },
    { id: 5, src: IMG_SEAL, name: 'Seal' },
];

// Initialize Frames & Load Header
function init() {
    // Load Header
    const headerImg = new Image();
    headerImg.src = IMG_HEADER;
    headerImg.onload = () => {
        headerImage = headerImg;
        if (currentImage) draw(); // Redraw if image already waiting
    };

    // Load Frames UI
    frames.forEach(frame => {
        const div = document.createElement('div');
        div.className = 'frame-option';
        const img = document.createElement('img');
        img.src = frame.src;
        img.alt = frame.name;
        // Fallback if image generation failed: use a colored placeholder
        img.onerror = () => {
            img.style.display = 'none';
            div.textContent = frame.name;
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.fontSize = '12px';
        };

        div.appendChild(img);
        div.onclick = () => selectFrame(frame, div);
        framesList.appendChild(div);
    });
}

function selectFrame(frame, element) {
    document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const img = new Image();
    img.src = frame.src;
    img.onload = () => {
        currentFrame = img;
        draw();
    };
    img.onerror = () => {
        // Create a programmatic frame if asset is missing
        currentFrame = { type: 'fallback', color: frame.id === 1 ? '#FFD700' : frame.id === 2 ? '#C0C0C0' : '#8B4513' };
        draw();
    }
}

// Handle File Input (Upload)
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

// Handle Camera Input
cameraBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Show a modal or overlay to capture? 
        // For simplicity, we'll swap the canvas area with video temporarily
        // But the user request implies "take the picture", likely system camera on mobile
        // effectively triggering file input with capture="camera". 
        // However, since we have a dedicated button, let's trigger the file input with capture attribute if on mobile,
        // or just click the file input programmatically.

        // Better approach for web app "Camera" button:
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
        fileInput.removeAttribute('capture'); // Reset

    } catch (err) {
        // Fallback to uploading if camera fails
        console.error("Camera access error", err);
        fileInput.click();
    }
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;

            // Set canvas size to match image aspect ratio (Normal Ratio)
            // Limit max dimension to avoid huge canvases
            const maxDim = 1600;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
                const ratio = width / height;
                if (width > height) {
                    width = maxDim;
                    height = maxDim / ratio;
                } else {
                    height = maxDim;
                    width = maxDim * ratio;
                }
            }

            canvas.width = width;
            canvas.height = height;

            canvas.style.display = 'block';
            placeholder.style.display = 'none';
            canvasArea.style.aspectRatio = `${canvas.width}/${canvas.height}`;
            canvasArea.style.border = 'none';

            downloadBtn.disabled = false;
            draw();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function draw() {
    if (!currentImage) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Image (Fit canvas exactly since canvas is sized to image)
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // Draw Footer (Selected Frame as Bottom Overlay)
    if (currentFrame) {
        if (currentFrame.type === 'fallback') {
            // Draw a thick border at the bottom
            ctx.fillStyle = currentFrame.color;
            ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
        } else {
            // Calculate height maintaining aspect ratio
            const aspect = currentFrame.width / currentFrame.height;
            const drawHeight = canvas.width / aspect;
            // Draw at bottom
            ctx.drawImage(currentFrame, 0, canvas.height - drawHeight, canvas.width, drawHeight);
        }
    }

    // Draw Header Branding (Always on top)
    if (headerImage) {
        // Draw header at the top, scaling to width
        // Assuming the header is a banner, we fit it to width
        const headerAspectRatio = headerImage.width / headerImage.height;
        const drawHeight = canvas.width / headerAspectRatio;
        ctx.drawImage(headerImage, 0, 0, canvas.width, drawHeight);
    }
}

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'framed_photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
    link.click();
});

// Init
init();
