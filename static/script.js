document.addEventListener('DOMContentLoaded', function() {
    // Карта Владивостока с тёплыми тайлами
    const map = L.map('map', {
        center: [43.115, 131.885],
        zoom: 13,
        zoomControl: true,
        fadeAnimation: true,
        attributionControl: false // убираем стандартную атрибуцию, добавим свою внизу (можно и оставить)
    });

    // Используем красивые тайлы CartoDB Voyager (тёплые тона)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
    }).addTo(map);

    // Добавляем маленькую атрибуцию в угол (чтобы было корректно)
    map.attributionControl.addAttribution('© OpenStreetMap contributors');

    const audio = document.getElementById('bgMusic');
    const nowPlaying = document.getElementById('now-playing');

    // Загружаем места
    fetch('/api/places')
        .then(r => r.json())
        .then(places => {
            places.forEach(place => {
                // Создаём иконку с круглым фоном и эмодзи
                const icon = L.divIcon({
                    html: `<span>${place.emoji}</span>`,
                    className: 'emoji-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

                const popupContent = `
                    <div class="place-title">${place.emoji} ${place.title}</div>
                    <div class="place-desc">${place.desc}</div>
                    <button class="btn-choose" data-id="${place.id}">Поехали →</button>
                `;
                marker.bindPopup(popupContent);
            });

            // Обработчик выбора
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('.btn-choose');
                if (!btn) return;
                const placeId = parseInt(btn.dataset.id);
                const place = places.find(p => p.id === placeId);
                if (!place) return;

                // Открываем 2ГИС
                const url = `https://2gis.ru/route/point/${place.lat},${place.lng}?m=построить+маршрут&from=my`;
                window.open(url, '_blank');

                // Меняем музыку
                const musicPath = `/static/music/${place.music}`;
                audio.src = musicPath;
                audio.play().then(() => {
                    // Обновляем индикатор
                    nowPlaying.textContent = `🎵 Сейчас играет: ${place.title}`;
                }).catch(e => {
                    console.log('Автозапуск заблокирован, но трек загружен');
                    nowPlaying.textContent = `🎵 ${place.title} (нажми play, если музыка не началась)`;
                });

                // Закрываем попап
                map.closePopup();
            });

            // Пробуем запустить default-трек при загрузке
            audio.play().then(() => {
                nowPlaying.textContent = '🎵 Музыка играет';
            }).catch(() => {
                nowPlaying.textContent = '🎵 Нажми на место, чтобы включить музыку';
            });
        })
        .catch(err => console.error('Ошибка загрузки данных:', err));
});