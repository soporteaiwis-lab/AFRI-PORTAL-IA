
// Servicio inteligente para procesar URLs de video de diferentes fuentes

export const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // LIMPIEZA DE URL
    const cleanUrl = url.trim();

    // 1. Google Drive / Google Meet Recordings
    // Input: https://drive.google.com/file/d/ID_ARCHIVO/view...
    // Output: https://drive.google.com/file/d/ID_ARCHIVO/preview
    // Esta regex captura el ID y reconstruye la URL para evitar errores de redirección
    const driveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([-a-zA-Z0-9_]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    // 2. YouTube (Varios formatos)
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = cleanUrl.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    }

    // 3. Vimeo
    if (cleanUrl.includes('vimeo.com')) {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = cleanUrl.match(regExp);
        if (match) {
            return `https://player.vimeo.com/video/${match[1]}`;
        }
    }

    // Retorno por defecto
    return cleanUrl;
};

export const getVideoThumbnail = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
        }
    }
    return null;
};
