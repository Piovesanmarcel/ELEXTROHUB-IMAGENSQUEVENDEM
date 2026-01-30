
import React from 'react';

interface SVGMarketingRendererProps {
  templateId: string;
  productName: string;
  productImages: string[];
  logoUrl?: string;
  backgroundClass?: string;
  productDescription?: string;
  productBenefits?: string[];
  productFaqs?: Array<{ question: string; answer: string }>;
  productPainPoints?: string[];
  productSolutions?: string[];
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  seoDescription?: string;
  idealFor?: string;
  guarantee?: string;
}

export const SVGMarketingRenderer = ({
  templateId,
  productName,
  productImages,
  logoUrl,
  backgroundClass,
  productDescription,
  productBenefits,
  productFaqs,
  productPainPoints,
  productSolutions,
  testimonials,
  seoDescription,
  idealFor,
  guarantee
}: SVGMarketingRendererProps) => {
  
  const renderTemplate1 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg1)" />
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="150"
          y="150"
          width="900"
          height="600"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Product Name */}
      <text
        x="600"
        y="850"
        textAnchor="middle"
        fill="white"
        fontSize="72"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {productName}
      </text>
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="50"
          y="50"
          width="150"
          height="150"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Bottom Badge */}
      <rect x="400" y="950" width="400" height="80" rx="40" fill="#fbbf24" />
      <text
        x="600"
        y="1000"
        textAnchor="middle"
        fill="#92400e"
        fontSize="24"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ⭐ PRODUTO PREMIUM
      </text>
    </svg>
  );

  const renderTemplate2 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg2)" />
      
      {/* Title */}
      <text
        x="600"
        y="150"
        textAnchor="middle"
        fill="white"
        fontSize="48"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        💡 IDEAL PARA
      </text>
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="200"
          y="200"
          width="800"
          height="500"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Description */}
      <rect x="100" y="750" width="1000" height="200" rx="20" fill="rgba(255,255,255,0.9)" />
      <text
        x="600"
        y="820"
        textAnchor="middle"
        fill="#1f2937"
        fontSize="32"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {idealFor ? idealFor.substring(0, 80) + '...' : 'Ideal para pessoas que valorizam qualidade'}
      </text>
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="1000"
          y="50"
          width="120"
          height="120"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate3 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg3)" />
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="100"
          y="100"
          width="1000"
          height="600"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Guarantee Section */}
      <rect x="150" y="750" width="900" height="300" rx="30" fill="rgba(255,255,255,0.95)" />
      <text
        x="600"
        y="820"
        textAnchor="middle"
        fill="#059669"
        fontSize="36"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        🛡️ GARANTIA TOTAL
      </text>
      <text
        x="600"
        y="900"
        textAnchor="middle"
        fill="#374151"
        fontSize="24"
        fontFamily="Arial, sans-serif"
      >
        {guarantee ? guarantee.substring(0, 100) + '...' : 'Garantia completa ou seu dinheiro de volta!'}
      </text>
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="50"
          y="50"
          width="150"
          height="150"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate4 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg4)" />
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="150"
          y="100"
          width="900"
          height="700"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Description */}
      <rect x="100" y="850" width="1000" height="250" rx="25" fill="rgba(255,255,255,0.9)" />
      <text
        x="600"
        y="950"
        textAnchor="middle"
        fill="#374151"
        fontSize="28"
        fontFamily="Arial, sans-serif"
      >
        {seoDescription ? seoDescription.substring(0, 120) + '...' : 'Produto premium com qualidade garantida'}
      </text>
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="1000"
          y="50"
          width="150"
          height="150"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate5 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg5)" />
      
      {/* Title */}
      <text
        x="600"
        y="100"
        textAnchor="middle"
        fill="white"
        fontSize="48"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ✨ BENEFÍCIOS
      </text>
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="50"
          y="150"
          width="500"
          height="400"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Benefits */}
      {productBenefits && productBenefits.slice(0, 4).map((benefit, index) => (
        <g key={index}>
          <rect x="600" y={200 + index * 120} width="550" height="80" rx="15" fill="rgba(255,255,255,0.9)" />
          <text
            x="875"
            y={245 + index * 120}
            textAnchor="middle"
            fill="#374151"
            fontSize="20"
            fontFamily="Arial, sans-serif"
          >
            ✓ {benefit.substring(0, 40)}
          </text>
        </g>
      ))}
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="50"
          y="600"
          width="120"
          height="120"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate6 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg6)" />
      
      {/* Title */}
      <text
        x="600"
        y="100"
        textAnchor="middle"
        fill="white"
        fontSize="42"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ❓ PERGUNTAS FREQUENTES
      </text>
      
      {/* FAQs */}
      {productFaqs && productFaqs.slice(0, 3).map((faq, index) => (
        <g key={index}>
          <rect x="100" y={200 + index * 250} width="1000" height="200" rx="20" fill="rgba(255,255,255,0.95)" />
          <text
            x="150"
            y={250 + index * 250}
            fill="#059669"
            fontSize="24"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            Q: {faq.question.substring(0, 50)}
          </text>
          <text
            x="150"
            y={300 + index * 250}
            fill="#374151"
            fontSize="20"
            fontFamily="Arial, sans-serif"
          >
            A: {faq.answer.substring(0, 80)}
          </text>
        </g>
      ))}
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="1000"
          y="50"
          width="120"
          height="120"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate7 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg7)" />
      
      {/* Title */}
      <text
        x="600"
        y="80"
        textAnchor="middle"
        fill="white"
        fontSize="42"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        🔄 ANTES vs DEPOIS
      </text>
      
      {/* Before Section */}
      <rect x="50" y="150" width="500" height="400" rx="20" fill="rgba(255,255,255,0.9)" />
      <text
        x="300"
        y="200"
        textAnchor="middle"
        fill="#dc2626"
        fontSize="28"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ❌ ANTES
      </text>
      {productPainPoints && productPainPoints.slice(0, 3).map((pain, index) => (
        <text
          key={index}
          x="80"
          y={250 + index * 50}
          fill="#374151"
          fontSize="16"
          fontFamily="Arial, sans-serif"
        >
          • {pain.substring(0, 40)}
        </text>
      ))}
      
      {/* After Section */}
      <rect x="650" y="150" width="500" height="400" rx="20" fill="rgba(255,255,255,0.9)" />
      <text
        x="900"
        y="200"
        textAnchor="middle"
        fill="#059669"
        fontSize="28"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ✅ DEPOIS
      </text>
      {productSolutions && productSolutions.slice(0, 3).map((solution, index) => (
        <text
          key={index}
          x="680"
          y={250 + index * 50}
          fill="#374151"
          fontSize="16"
          fontFamily="Arial, sans-serif"
        >
          • {solution.substring(0, 40)}
        </text>
      ))}
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="400"
          y="600"
          width="400"
          height="300"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="50"
          y="50"
          width="120"
          height="120"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate8 = () => (
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="1200" height="1200" fill="url(#bg8)" />
      
      {/* Title */}
      <text
        x="600"
        y="80"
        textAnchor="middle"
        fill="white"
        fontSize="42"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        💬 DEPOIMENTOS
      </text>
      
      {/* Product Image */}
      {productImages[0] && (
        <image
          x="50"
          y="150"
          width="400"
          height="300"
          href={productImages[0]}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      
      {/* Testimonials */}
      {testimonials && testimonials.slice(0, 3).map((testimonial, index) => (
        <g key={index}>
          <rect x="500" y={150 + index * 200} width="650" height="150" rx="15" fill="rgba(255,255,255,0.95)" />
          <text
            x="550"
            y={190 + index * 200}
            fill="#fbbf24"
            fontSize="20"
            fontFamily="Arial, sans-serif"
          >
            ⭐⭐⭐⭐⭐
          </text>
          <text
            x="550"
            y={220 + index * 200}
            fill="#374151"
            fontSize="16"
            fontFamily="Arial, sans-serif"
          >
            "{testimonial.text.substring(0, 60)}"
          </text>
          <text
            x="550"
            y={250 + index * 200}
            fill="#6b7280"
            fontSize="14"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            - {testimonial.name}
          </text>
        </g>
      ))}
      
      {/* Logo */}
      {logoUrl && (
        <image
          x="50"
          y="500"
          width="120"
          height="120"
          href={logoUrl}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );

  const renderTemplate = () => {
    switch (templateId) {
      case 'template1': return renderTemplate1();
      case 'template2': return renderTemplate2();
      case 'template3': return renderTemplate3();
      case 'template4': return renderTemplate4();
      case 'template5': return renderTemplate5();
      case 'template6': return renderTemplate6();
      case 'template7': return renderTemplate7();
      case 'template8': return renderTemplate8();
      default: return renderTemplate1();
    }
  };

  return renderTemplate();
};
