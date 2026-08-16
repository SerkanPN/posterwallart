import React from 'react';

const Tos: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-8 text-indigo-600">Terms of Service & Privacy Policy</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
        <p className="mb-2"><strong>Last Updated:</strong> August 16, 2026</p>
        <p className="mb-4">This Privacy Policy explains the data collection and usage terms of the websites managed by DigitalArtHouseLTD ("Company", "We") and the PinTag application.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">1. Information Collected</h3>
        <p className="mb-4">The PinTag application only collects general keyword and trend data via the Pinterest API. Personally identifiable information (name, email, physical address, etc.) belonging to end-users is not collected or processed.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">2. Use of Data</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Conducting keyword research and trend analysis.</li>
          <li>Generating market research reports for our e-commerce operations.</li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-2">3. Data Sharing and Third Parties</h3>
        <p className="mb-4">No collected data is sold, rented, or shared with third parties for external marketing purposes. Our application communicates solely with Pinterest's official API infrastructure and strictly complies with Pinterest's Developer Guidelines.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">4. Data Security</h3>
        <p className="mb-4">Authorization tokens and analytical data transferred through the application are encrypted and protected in accordance with industry standards.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Terms of Service</h2>
        <p className="mb-4">By accessing or using the services provided by DigitalArtHouseLTD (including posterwallart.shop and the PinTag application), you agree to be bound by these Terms of Service.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">1. Use of Services</h3>
        <p className="mb-4">You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for ensuring that your use of the Pinterest API through our tools complies with Pinterest's policies.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">2. Intellectual Property</h3>
        <p className="mb-4">All content, designs, graphics, and software associated with posterwallart.shop and PinTag are the exclusive property of DigitalArtHouseLTD.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">3. Limitation of Liability</h3>
        <p className="mb-4">DigitalArtHouseLTD shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services or products.</p>
        
        <h3 className="text-xl font-medium mt-6 mb-2">4. Contact Information</h3>
        <p className="mb-4">For any questions regarding our terms or privacy practices, you can contact us at:</p>
        <ul className="list-none mb-4">
          <li><strong>Company:</strong> DigitalArtHouseLTD</li>
          <li><strong>Website:</strong> posterwallart.shop</li>
        </ul>
      </section>
    </div>
  );
};

export default Tos;
