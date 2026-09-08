/**
 * Redimensiona e comprime uma imagem para perfil (Avatar)
 * Gera um Base64 WebP/JPEG leve (~15KB-30KB) com resolução máx 256x256,
 * garantindo carregamento instantâneo, sem estourar o localStorage e
 * com sincronização ultrarrápida no Supabase.
 */
export function compressAvatarImage(file, maxDimension = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    // Se já for uma URL externa (unsplash, https, etc.), retorna direto
    if (typeof file === 'string') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao carregar formato da imagem'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionamento proporcional centrado
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target.result);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Exporta preferencialmente em webp (ou jpeg) com compressão inteligente
          let compressedData = canvas.toDataURL('image/webp', quality);
          if (!compressedData.startsWith('data:image/webp')) {
            compressedData = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(compressedData);
        } catch (err) {
          console.warn('Compressão via Canvas falhou, usando imagem padrão:', err);
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
