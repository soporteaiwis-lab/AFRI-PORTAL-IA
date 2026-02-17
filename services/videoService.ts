
// Servicio inteligente para procesar URLs de video de diferentes fuentes (Google, YouTube, etc.)

export const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // 1. Google Drive / Google Meet Recordings
    // Input: https://drive.google.com/file/d/ID_ARCHIVO/view...
    // Output: https://drive.google.com/file/d/ID_ARCHIVO/preview
    if (url.includes('drive.google.com')) {
        // Reemplazar /view o /edit por /preview para permitir embedding
        return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }

    // 2. YouTube (Varios formatos)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    }

    // 3. Vimeo
    if (url.includes('vimeo.com')) {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = url.match(regExp);
        if (match) {
            return `https://player.vimeo.com/video/${match[1]}`;
        }
    }

    // 4. Archivos directos (.mp4, .mov) o enlaces genéricos
    // Se retornan tal cual para intentar usarlos en iframe o tag video
    return url;
};

export const getVideoThumbnail = (url: string): string | null => {
    if (!url) return null;

    // Solo YouTube permite obtener thumbnails fáciles sin API Key
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
        }
    }
    
    // Para Google Drive y otros, retornamos null para que la UI muestre un placeholder elegante
    return null;
};
