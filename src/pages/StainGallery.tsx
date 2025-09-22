import React, { useState } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Import stain images
import agedBarrelImg from '@/assets/stains/aged-barrel.jpg';
import antiqueBrownImg from '@/assets/stains/antique-brown.jpg';
import cherryImg from '@/assets/stains/cherry.jpg';
import chestnutImg from '@/assets/stains/chestnut.jpg';
import classicGrayImg from '@/assets/stains/classic-gray.jpg';
import coffeeBrownImg from '@/assets/stains/coffee-brown.jpg';
import colonialMapleImg from '@/assets/stains/colonial-maple.jpg';
import countryWhiteImg from '@/assets/stains/country-white.jpg';
import darkWalnutImg from '@/assets/stains/dark-walnut.jpg';
import ebonyImg from '@/assets/stains/ebony.jpg';
import englishChestnutImg from '@/assets/stains/english-chestnut.jpg';
import espressoImg from '@/assets/stains/espresso.jpg';
import goldenOakImg from '@/assets/stains/golden-oak.jpg';
import honeyImg from '@/assets/stains/honey.jpg';
import jacobeanImg from '@/assets/stains/jacobean.jpg';
import mahoganyImg from '@/assets/stains/mahogany.jpg';
import naturalImg from '@/assets/stains/natural.jpg';
import nutmegImg from '@/assets/stains/nutmeg.jpg';
import provincialImg from '@/assets/stains/provincial.jpg';
import redOakImg from '@/assets/stains/red-oak.jpg';
import royalMahoganyImg from '@/assets/stains/royal-mahogany.jpg';
import sedonaRedImg from '@/assets/stains/sedona-red.jpg';
import specialWalnutImg from '@/assets/stains/special-walnut.jpg';
import weatheredOakImg from '@/assets/stains/weathered-oak.jpg';

// Import process image
import stainProcessImg from '@/assets/stain-process-work.jpg';
const StainGallery = () => {
  const [expandedWoodType, setExpandedWoodType] = useState<string>('white-oak');
  const whiteOakStains = [{
    name: 'Aged Barrel',
    image: agedBarrelImg
  }, {
    name: 'Antique Brown',
    image: antiqueBrownImg
  }, {
    name: 'Cherry',
    image: cherryImg
  }, {
    name: 'Chestnut',
    image: chestnutImg
  }, {
    name: 'Classic Gray',
    image: classicGrayImg
  }, {
    name: 'Coffee Brown',
    image: coffeeBrownImg
  }, {
    name: 'Colonial Maple',
    image: colonialMapleImg
  }, {
    name: 'Country White',
    image: countryWhiteImg
  }, {
    name: 'Dark Walnut',
    image: darkWalnutImg
  }, {
    name: 'Ebony',
    image: ebonyImg
  }, {
    name: 'English Chestnut',
    image: englishChestnutImg
  }, {
    name: 'Espresso',
    image: espressoImg
  }, {
    name: 'Golden Oak',
    image: goldenOakImg
  }, {
    name: 'Honey',
    image: honeyImg
  }, {
    name: 'Jacobean',
    image: jacobeanImg
  }, {
    name: 'Mahogany',
    image: mahoganyImg
  }, {
    name: 'Natural',
    image: naturalImg
  }, {
    name: 'Nutmeg',
    image: nutmegImg
  }, {
    name: 'Provincial',
    image: provincialImg
  }, {
    name: 'Red Oak',
    image: redOakImg
  }, {
    name: 'Royal Mahogany',
    image: royalMahoganyImg
  }, {
    name: 'Sedona Red',
    image: sedonaRedImg
  }, {
    name: 'Special Walnut',
    image: specialWalnutImg
  }, {
    name: 'Weathered Oak',
    image: weatheredOakImg
  }];
  const redOakStains = [{
    name: 'Aged Barrel',
    image: agedBarrelImg
  }, {
    name: 'Antique Brown',
    image: antiqueBrownImg
  }, {
    name: 'Cherry',
    image: cherryImg
  }, {
    name: 'Chestnut',
    image: chestnutImg
  }, {
    name: 'Classic Gray',
    image: classicGrayImg
  }, {
    name: 'Coffee Brown',
    image: coffeeBrownImg
  }, {
    name: 'Colonial Maple',
    image: colonialMapleImg
  }, {
    name: 'Country White',
    image: countryWhiteImg
  }, {
    name: 'Dark Walnut',
    image: darkWalnutImg
  }, {
    name: 'Ebony',
    image: ebonyImg
  }, {
    name: 'English Chestnut',
    image: englishChestnutImg
  }, {
    name: 'Espresso',
    image: espressoImg
  }, {
    name: 'Golden Oak',
    image: goldenOakImg
  }, {
    name: 'Honey',
    image: honeyImg
  }, {
    name: 'Jacobean',
    image: jacobeanImg
  }, {
    name: 'Mahogany',
    image: mahoganyImg
  }, {
    name: 'Natural',
    image: naturalImg
  }, {
    name: 'Nutmeg',
    image: nutmegImg
  }, {
    name: 'Provincial',
    image: provincialImg
  }, {
    name: 'Red Oak',
    image: redOakImg
  }, {
    name: 'Royal Mahogany',
    image: royalMahoganyImg
  }, {
    name: 'Sedona Red',
    image: sedonaRedImg
  }, {
    name: 'Special Walnut',
    image: specialWalnutImg
  }, {
    name: 'Weathered Oak',
    image: weatheredOakImg
  }];
  const toggleWoodType = (woodType: string) => {
    setExpandedWoodType(expandedWoodType === woodType ? '' : woodType);
  };
  const StainGrid = ({
    stains
  }: {
    stains: typeof whiteOakStains;
  }) => <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      {stains.map((stain, index) => <Card key={index} className="group cursor-pointer hover:shadow-elegant transition-smooth">
          <CardContent className="p-0">
            <div className="aspect-square bg-gradient-subtle rounded-lg overflow-hidden">
              <img src={stain.image} alt={stain.name} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-navy text-center">
                {stain.name}
              </h3>
            </div>
          </CardContent>
        </Card>)}
    </div>;
  return <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-subtle py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-6">
                Stain Gallery
              </h1>
              <p className="text-xl text-grey mb-8">
                Explore our comprehensive collection of premium wood stains. 
                Each color is professionally applied to showcase the natural beauty and variations of different wood species.
              </p>
              <div className="bg-white border-l-4 border-gold p-6 rounded-lg shadow-soft">
                <p className="text-grey italic">
                  <strong>Important Note:</strong> Colors shown are representative samples. Natural wood grain and tone variations 
                  mean your final stain color will vary slightly from board to board, creating unique character in each project.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stain Gallery */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              
              {/* White Oak Section */}
              <div className="mb-12">
                <button onClick={() => toggleWoodType('white-oak')} className="w-full flex items-center justify-between p-6 bg-white rounded-lg shadow-soft hover:shadow-elegant transition-smooth border-2 border-transparent hover:border-gold/20">
                  <h2 className="text-3xl font-heading font-bold text-navy">
                    WHITE OAK
                  </h2>
                  {expandedWoodType === 'white-oak' ? <ChevronUp className="w-6 h-6 text-gold" /> : <ChevronDown className="w-6 h-6 text-gold" />}
                </button>
                
                {expandedWoodType === 'white-oak' && <div className="mt-6 p-6 bg-white rounded-lg shadow-soft">
                    <p className="text-grey mb-6 text-center">
                      Colors are shown on White Oak. Natural wood tones vary, so expect your final stain color to vary slightly from board to board.
                    </p>
                    <StainGrid stains={whiteOakStains} />
                  </div>}
              </div>

              {/* Red Oak Section */}
              <div className="mb-12">
                <button onClick={() => toggleWoodType('red-oak')} className="w-full flex items-center justify-between p-6 bg-white rounded-lg shadow-soft hover:shadow-elegant transition-smooth border-2 border-transparent hover:border-gold/20">
                  <h2 className="text-3xl font-heading font-bold text-navy">
                    RED OAK
                  </h2>
                  {expandedWoodType === 'red-oak' ? <ChevronUp className="w-6 h-6 text-gold" /> : <ChevronDown className="w-6 h-6 text-gold" />}
                </button>
                
                {expandedWoodType === 'red-oak' && <div className="mt-6 p-6 bg-white rounded-lg shadow-soft">
                    <p className="text-grey mb-6 text-center">
                      Colors are shown on Red Oak. Red Oak typically accepts stain more readily and may appear darker than White Oak with the same stain color.
                    </p>
                    <StainGrid stains={redOakStains} />
                  </div>}
              </div>

              {/* Staining Process Section */}
              <div className="mb-12">
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="aspect-[4/3] lg:aspect-auto">
                      <img src={stainProcessImg} alt="AXO Floors professional applying and testing different stain colors on hardwood flooring" className="w-full h-full object-cover" />
                    </div>
                    
                  </div>
                </Card>
              </div>

              {/* Call to Action Variations */}
              <div className="space-y-8">
                
                {/* Soft CTA */}
                

                {/* Medium CTA */}
                <Card className="bg-navy text-white text-center p-8">
                  <h3 className="text-2xl font-heading font-bold mb-4">
                    Stop Guessing About Color
                  </h3>
                  <p className="text-lg mb-6 opacity-90">
                    See exactly how each stain will look on your floors. Free in-home color testing with no obligation to purchase.
                  </p>
                  <Button variant="default" size="lg" className="bg-gold text-navy hover:bg-gold/90">
                    Book Your Color Test
                  </Button>
                </Card>

                {/* Aggressive CTA */}
                

              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>;
};
export default StainGallery;