// File name: src/properties/dto/index.ts

// Export all DTOs from unified location
export { CreatePropertyDto } from './create-property.dto';
export { UpdatePropertyDto } from './update-property.dto';
export { PropertySearchDto, PropertyMatchDto } from './property-search.dto';

// Additional DTOs from merged structure
export { PropertyFilterDto } from './property-filter.dto';
export { PropertyResponseDto } from './property-response.dto';
export { PropertyAnalyticsResponseDto } from './property-analytics.dto';
export { UploadImagesDto } from './upload-images.dto';