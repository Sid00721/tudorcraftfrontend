import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Slider,
    CircularProgress,
    Alert,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

const PhotoCropModal = ({ open, onClose, onSave, currentPhotoUrl = null }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [containerSize] = useState({ width: 400, height: 300 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const cropperRef = useRef(null);

    const handleFileSelect = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            setError('Please select a valid image file (JPG, PNG, or WebP).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(`File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please select an image smaller than 5MB.`);
            return;
        }

        setError('');
        setSelectedFile(file);
        
        // Create preview URL from file
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }, []);

    // Calculate image display size and crop area when image loads
    const handleImageLoad = useCallback(() => {
        const img = imageRef.current;
        if (!img) return;

        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        const imgAspect = imgNaturalWidth / imgNaturalHeight;

        // Calculate display size to fit container
        let displayWidth, displayHeight;
        if (imgAspect > containerSize.width / containerSize.height) {
            // Wide image - fit to container width
            displayWidth = containerSize.width;
            displayHeight = containerSize.width / imgAspect;
        } else {
            // Tall image - fit to container height
            displayHeight = containerSize.height;
            displayWidth = containerSize.height * imgAspect;
        }

        setImageSize({ width: displayWidth, height: displayHeight });

        // Set initial crop area to center
        const cropSize = Math.min(displayWidth, displayHeight) * 0.8;
        setCropArea({
            x: (displayWidth - cropSize) / 2,
            y: (displayHeight - cropSize) / 2,
            size: cropSize
        });
    }, [containerSize]);

    const generateCroppedImage = useCallback(() => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;
            
            if (!img || !canvas) {
                resolve(null);
                return;
            }

            // Set canvas to output size (400x400 circle)
            canvas.width = 400;
            canvas.height = 400;
            ctx.clearRect(0, 0, 400, 400);

            // Calculate the crop area in relation to the original image
            const scaleX = img.naturalWidth / imageSize.width;
            const scaleY = img.naturalHeight / imageSize.height;
            
            const sourceX = cropArea.x * scaleX;
            const sourceY = cropArea.y * scaleY;
            const sourceSize = cropArea.size * scaleX;

            // Draw circular clipping path
            ctx.save();
            ctx.beginPath();
            ctx.arc(200, 200, 200, 0, 2 * Math.PI);
            ctx.clip();

            // Draw the cropped portion of the image
            ctx.drawImage(
                img,
                sourceX, sourceY, sourceSize, sourceSize, // Source rectangle
                0, 0, 400, 400 // Destination rectangle
            );
            ctx.restore();

            // Convert to blob
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
    }, [cropArea, imageSize]);

    const handleSave = async () => {
        if (!selectedFile) {
            setError('Please select a new image file to upload.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const fileToUpload = await generateCroppedImage();

            if (!fileToUpload) {
                throw new Error('Failed to generate cropped image');
            }

            await onSave(fileToUpload);
            
            // Reset and close
            setSelectedFile(null);
            setImagePreview(null);
            setCropArea({ x: 0, y: 0, size: 200 });
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save photo: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setCropArea({ x: 0, y: 0, size: 200 });
        setError('');
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={{ xs: true, sm: false }}
            PaperProps={{
                sx: { 
                    borderRadius: { xs: 0, sm: 3 },
                    margin: { xs: 0, sm: 2 }
                }
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhotoCameraIcon />
                    Crop Profile Photo
                </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pb: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* File Upload */}
                    <Box>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => fileInputRef.current?.click()}
                            startIcon={<PhotoCameraIcon />}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Choose Photo to Crop
                        </Button>
                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                            Max 5MB. JPG, PNG, or WebP format.
                        </Typography>
                    </Box>

                    {/* Image Cropping Interface */}
                    {imagePreview && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Select the area you want to use for your profile photo
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
                                {/* Crop Area */}
                                <Box sx={{ flex: 1 }}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: containerSize.width,
                                            height: containerSize.height,
                                            border: '2px solid #e0e0e0',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            margin: '0 auto',
                                            backgroundColor: '#f5f5f5',
                                        }}
                                    >
                                        {/* The actual image */}
                                        <img
                                            ref={imageRef}
                                            src={imagePreview}
                                            alt="Original"
                                            onLoad={handleImageLoad}
                                            style={{
                                                position: 'absolute',
                                                left: (containerSize.width - imageSize.width) / 2,
                                                top: (containerSize.height - imageSize.height) / 2,
                                                width: imageSize.width,
                                                height: imageSize.height,
                                                objectFit: 'contain',
                                            }}
                                        />
                                        
                                        {/* Crop overlay */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: cropArea.x + (containerSize.width - imageSize.width) / 2,
                                                top: cropArea.y + (containerSize.height - imageSize.height) / 2,
                                                width: cropArea.size,
                                                height: cropArea.size,
                                                border: '3px solid #2196F3',
                                                borderRadius: '50%',
                                                cursor: 'move',
                                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                            }}
                                            onMouseDown={(e) => {
                                                const rect = e.currentTarget.parentElement.getBoundingClientRect();
                                                const startX = e.clientX - rect.left - cropArea.x - (containerSize.width - imageSize.width) / 2;
                                                const startY = e.clientY - rect.top - cropArea.y - (containerSize.height - imageSize.height) / 2;
                                                
                                                const handleMouseMove = (e) => {
                                                    const newX = e.clientX - rect.left - startX - (containerSize.width - imageSize.width) / 2;
                                                    const newY = e.clientY - rect.top - startY - (containerSize.height - imageSize.height) / 2;
                                                    
                                                    setCropArea(prev => ({
                                                        ...prev,
                                                        x: Math.max(0, Math.min(imageSize.width - prev.size, newX)),
                                                        y: Math.max(0, Math.min(imageSize.height - prev.size, newY)),
                                                    }));
                                                };
                                                
                                                const handleMouseUp = () => {
                                                    document.removeEventListener('mousemove', handleMouseMove);
                                                    document.removeEventListener('mouseup', handleMouseUp);
                                                };
                                                
                                                document.addEventListener('mousemove', handleMouseMove);
                                                document.addEventListener('mouseup', handleMouseUp);
                                            }}
                                        />
                                    </Box>
                                    
                                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
                                        Drag the blue circle to select the area for your profile photo
                                    </Typography>
                                </Box>

                                {/* Controls */}
                                <Box sx={{ width: 200 }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                        Crop Size
                                    </Typography>
                                    <Slider
                                        value={cropArea.size}
                                        onChange={(_, newValue) => {
                                            const maxSize = Math.min(imageSize.width, imageSize.height);
                                            const size = Math.min(newValue, maxSize);
                                            setCropArea(prev => ({
                                                ...prev,
                                                size,
                                                x: Math.max(0, Math.min(imageSize.width - size, prev.x)),
                                                y: Math.max(0, Math.min(imageSize.height - size, prev.y)),
                                            }));
                                        }}
                                        min={50}
                                        max={Math.min(imageSize.width, imageSize.height) || 300}
                                        sx={{ mb: 3 }}
                                    />
                                    
                                    {/* Preview */}
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                        Preview
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            border: '2px solid #2196F3',
                                            overflow: 'hidden',
                                            backgroundColor: '#f5f5f5',
                                            margin: '0 auto',
                                            position: 'relative',
                                        }}
                                    >
                                        {imagePreview && imageSize.width > 0 && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundImage: `url(${imagePreview})`,
                                                    backgroundSize: `${(imageSize.width / cropArea.size) * 100}% auto`,
                                                    backgroundPosition: `${(-cropArea.x / cropArea.size) * 100}% ${(-cropArea.y / cropArea.size) * 100}%`,
                                                    backgroundRepeat: 'no-repeat',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Hidden canvas for cropping */}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    startIcon={<CancelIcon />}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={!selectedFile || saving}
                >
                    {saving ? 'Saving...' : 'Save Cropped Photo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PhotoCropModal;