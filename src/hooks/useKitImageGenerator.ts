import { useGeminiBackgroundGenerator } from './useGeminiBackgroundGenerator';
import type { KitGenerationRequest, KitStyle, KitLayout, SingleProductKitRequest } from '@/types/kit-generator';
import { layoutPrompts, stylePrompts, getSizeDistribution } from '@/types/kit-generator';

export type { KitStyle, KitLayout };

const getQuantityArrangement = (qty: number): string => {
    if (qty <= 3) return '- Arrange units side by side or in triangle formation';
    if (qty <= 5) return '- Use pyramid or arc arrangement for visual appeal';
    if (qty <= 8) return '- Use 2 rows or circular arrangement';
    if (qty <= 12) return '- Use grid or stacked arrangement (3x4, 4x3)';
    return '- Use organized grid or cascading pattern for large quantity';
};

const buildSingleProductKitPrompt = (request: SingleProductKitRequest): string => {
    const layoutSection = layoutPrompts[request.layout];
    const styleSection = stylePrompts[request.style];

    const ctaSection = request.ctaText
        ? `
USER'S CTA TEXT - INTEGRATE INTO IMAGE:
"${request.ctaText}"

USE THIS CTA TO:
- Create a prominent badge/ribbon/seal with this exact text
- Position attractively without covering products
- Use contrasting colors for high visibility
- Make it commercial, eye-catching and professional`
        : `
GENERATE AUTOMATIC CTA:
- Create a promotional badge showing quantity (e.g., "Kit ${request.quantity}", "${request.quantity}x")
- Position attractively without covering products
- Use contrasting colors for visibility`;

    return `SINGLE PRODUCT KIT IMAGE GENERATION:

You have received 1 product image.
Create a professional KIT/BUNDLE image showing ${request.quantity} IDENTICAL units of this product.

CRITICAL RULES:
1. PRESERVE 100% the appearance of the product (colors, shapes, details, textures)
2. Show EXACTLY ${request.quantity} units of the SAME product
3. DO NOT alter, distort, or modify the product in any way
4. Arrange all units attractively and professionally
5. Create visual impact showing quantity/value

${ctaSection}

QUANTITY ARRANGEMENT FOR ${request.quantity} UNITS:
${getQuantityArrangement(request.quantity)}

${layoutSection}

${styleSection}

COMPOSITION REQUIREMENTS:
- All ${request.quantity} units clearly visible
- Organized, balanced, not chaotic
- Fill 70-85% of image area
- Professional lighting across all units
- High resolution, sharp details
- White/neutral background visible only as frame (15-30% of area)

Generate the kit image now.`;
};

const buildKitPrompt = (request: KitGenerationRequest): string => {
    const productCount = request.images.length;
    const layoutSection = layoutPrompts[request.layout];
    const styleSection = stylePrompts[request.style];

    const sameProductSection = request.sameProduct
        ? `
SAME PRODUCT MODE:
- All ${productCount} images show the SAME product
- Create a kit displaying ${productCount} IDENTICAL units
- Show them as a bundle/multi-pack
- Emphasize quantity value (e.g., "Kit com ${productCount}", "${productCount}-pack")
- Position units attractively to show quantity`
        : `
DIFFERENT PRODUCTS MODE:
- You have ${productCount} DIFFERENT products
- Combine them harmoniously as a complementary kit
- Each product maintains its unique identity
- Products should look like they belong together`;

    const descriptionSection = request.kitDescription
        ? `
MAIN CONCEPT - USE AS PRIMARY GUIDE:
"${request.kitDescription}"

The kit description above is the MAIN CONTEXT for this image.
Use it to:
- Determine the ideal positioning of products
- Choose complementary elements that reinforce the concept
- Create CTAs that match the kit theme
- Guide the overall visual style and mood`
        : '';

    return `KIT IMAGE GENERATION INSTRUCTIONS:

You have received ${productCount} product images.
Create ONE SINGLE PROFESSIONAL IMAGE combining these products as a KIT/BUNDLE.
${descriptionSection}
${sameProductSection}

CRITICAL RULES:
1. PRESERVE 100% the appearance of ALL products (colors, shapes, details, textures)
2. DO NOT alter, distort, or modify any product in any way
3. Position products harmoniously and attractively together
4. Create a visual composition that clearly shows they are a KIT/COMBO

${layoutSection}

CRITICAL SIZE RULES FOR ${productCount} PRODUCTS:
${getSizeDistribution(productCount)}
- BALANCE the visual size of products appropriately
- NORMALIZE product scales for visual harmony - do NOT use real-world size proportions
- Products together MUST FILL 70-85% of the total image area
- Adjust perspective and scale so products work together as a cohesive kit

PROMOTIONAL CTA ELEMENTS (REQUIRED):
- ADD visual promotional elements: ribbons, badges, seals, stickers
- Include "KIT", "COMBO", "PROMO" or similar visual CTAs
- Position CTAs attractively without covering products
- Make CTAs eye-catching, commercial and professional
- CTAs should complement the kit theme from description
- Use colors that contrast well with the products

${styleSection}

COMPOSITION REQUIREMENTS:
- Products FILL 70-85% of image area (not too small, not cropped)
- Balanced visual weight across all products
- Uniform lighting across all products
- Products at complementary angles
- Professional depth of field
- High resolution, sharp details
- White/neutral background visible only as frame (15-30% of area)

Generate the kit image now.`;
};

export const useKitImageGenerator = () => {
    const { generateBackground, isProcessing, progress, lastUsage } = useGeminiBackgroundGenerator();

    const generateKitImage = async (request: KitGenerationRequest) => {
        const prompt = buildKitPrompt(request);

        const result = await generateBackground(
            request.images,
            prompt,
            3,
            undefined,
            undefined,
            'kit_generation',
            undefined,
            request.apiKeyId
        );

        return result;
    };

    const generateSingleProductKit = async (request: SingleProductKitRequest) => {
        const prompt = buildSingleProductKitPrompt(request);

        const result = await generateBackground(
            [request.image],
            prompt,
            3,
            undefined,
            undefined,
            'kit_generation',
            undefined,
            request.apiKeyId
        );

        return result;
    };

    return {
        generateKitImage,
        generateSingleProductKit,
        isProcessing,
        progress,
        lastUsage
    };
};
