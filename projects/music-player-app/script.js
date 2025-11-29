const songs = [
	"All that.mp3",
	"Creative Minds.mp3",
	"Jazzy Frenchy.mp3",
	"Happy Rock.mp3",
	"Piano Moment.mp3",
];

const player = document.getElementById("player");

function createSongList() {
	const list = document.createElement("ol");
	for (let i = 0; i < songs.length; i++) {
		const item = document.createElement("li");
		item.appendChild(document.createTextNode(songs[i]));
		list.appendChild(item);
	}
	return list;
}

const songList = document.getElementById("songList");
songList.appendChild(createSongList());

const links = document.querySelectorAll("li");
for (const link of links) {
	link.addEventListener("click", setSong);
}

function setSong(e) {
	document.getElementById("album-art").classList.remove("pulse");
	const source = document.getElementById("source");
	source.src = "songs/" + e.target.innerText;
	document.querySelector(
		"#currentSong"
	).innerText = `Now Playing: ${e.target.innerText}`;
	player.load();
	player.play();
	document.getElementById("album-art").classList.add("pulse");
}

function playAudio() {
	if (player.readyState) {
		player.play();
	}
}

function pauseAudio() {
	player.pause();
}

const slider = document.getElementById("volumeSlider");
slider.oninput = function (e) {
	const volume = e.target.value;
	player.volume = volume;
};

function updateProgress() {
	if (player.currentTime > 0) {
		const progressBar = document.getElementById("progress");
		progressBar.value = (player.currentTime / player.duration) * 100;
	}
}
