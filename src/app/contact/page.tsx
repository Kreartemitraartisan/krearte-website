"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, Check, ExternalLink } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Format message for WhatsApp
    const message = `
*📩 NEW CONTACT INQUIRY*

*Name:* ${formData.name}
*Email:* ${formData.email}
*Subject:* ${formData.subject || "General Inquiry"}

*Message:*
${formData.message}

---
Sent from Krearte Website
`.trim();

    try {
      // ✅ Encode message for WhatsApp (no spaces in URL)
      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = "6287705661978";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // Redirect to WhatsApp
      window.open(whatsappUrl, "_blank");
      
      // Show success state
      setSubmitted(true);
      
      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
      
    } catch (error) {
      console.error("WhatsApp redirect error:", error);
      alert("❌ Failed to open WhatsApp. Please contact us directly at +62 877-0566-1978");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Maps Embed URL - Pakuwon Square, Surabaya (tanpa API key)
  // Coordinates: -7.295176, 112.675161
  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.842976284671!2d112.675161!3d-7.295176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7fa3c8b0b0b0b%3A0x1234567890abcdef!2sPakuwon%20Square!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid";
  
  // ✅ Google Maps Link untuk open larger map
  const googleMapsLink = "https://www.google.com/maps/place/Pakuwon+Square/@-7.295176,112.675161,17z";

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Back Navigation */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-16">
              <p className="text-sm font-light text-krearte-gray-600 mb-4 tracking-widest uppercase">
                Get in Touch
              </p>
              <h1 className="font-sans text-4xl md:text-6xl font-light mb-6 text-krearte-black">
                Contact Us
              </h1>
              <p className="text-lg font-light text-krearte-gray-600 max-w-2xl mx-auto">
                Have a question about our products or need help with your order? 
                We're here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
                <h2 className="font-sans text-2xl font-light mb-6">Send us a Message</h2>
                
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-sans text-xl font-normal mb-2">Message Sent!</h3>
                    <p className="text-krearte-gray-600 font-light">
                      We'll get back to you within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-normal text-krearte-black mb-2">
                        Message *
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-krearte-gray-50 border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-krearte-black text-white font-medium rounded-full hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Opening WhatsApp..."
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send via WhatsApp
                        </>
                      )}
                    </button>
                    <p className="text-xs text-krearte-gray-500 text-center">
                      You'll be redirected to WhatsApp to send your message.
                    </p>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-sans text-2xl font-light mb-6">Contact Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-krearte-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-krearte-black" />
                      </div>
                      <div>
                        <h3 className="font-medium text-krearte-black mb-1">Email</h3>
                        <a href="mailto:design@krearte.id" className="text-krearte-gray-600 font-light hover:text-krearte-black">
                          design@krearte.id
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-krearte-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-krearte-black" />
                      </div>
                      <div>
                        <h3 className="font-medium text-krearte-black mb-1">Phone</h3>
                        <a href="tel:+6287705661978" className="text-krearte-gray-600 font-light hover:text-krearte-black">
                          +62 877-0566-1978
                        </a>
                      </div>
                    </div>

                    {/* ✅ Clickable Location Box */}
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="flex items-start gap-4 p-4 bg-krearte-gray-50 rounded-lg border border-krearte-gray-200 hover:border-krearte-black hover:bg-krearte-gray-100 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-krearte-gray-200 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-krearte-black transition-colors">
                          <MapPin className="w-5 h-5 text-krearte-black group-hover:text-krearte-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-krearte-black">Location</h3>
                            <ExternalLink className="w-3 h-3 text-krearte-gray-400 group-hover:text-krearte-black transition-colors" />
                          </div>
                          <p className="text-krearte-gray-600 font-light text-sm">
                            Jl. Mayjend Yonosuwoyo, Pertokoan Pakuwon Square AK2 No.9,<br />
                            Lidah Wetan, Kec. Lakarsantri,<br />
                            Surabaya, Jawa Timur 60277
                          </p>
                          <p className="text-xs text-krearte-gray-500 mt-2 group-hover:text-krearte-black transition-colors">
                            Click to open in Google Maps →
                          </p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* ✅ GOOGLE MAPS IFRAME EMBED - Tanpa API Key */}
                <div className="bg-krearte-gray-100 rounded-lg overflow-hidden border border-krearte-gray-200">
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full"
                    title="Krearte Location - Pakuwon Square Surabaya"
                  />
                  <div className="p-4 bg-krearte-white flex items-center justify-center">
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Open larger map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="bg-krearte-black text-krearte-white rounded-lg p-8">
                  <h3 className="font-sans text-xl font-light mb-4">Business Hours</h3>
                  <div className="space-y-2 text-sm font-light">
                    <div className="flex justify-between">
                      <span className="text-krearte-gray-400">Monday - Friday</span>
                      <span>8:30 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-krearte-gray-400">Saturday</span>
                      <span>8:30 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-krearte-gray-400">Sunday & Public Holidays</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}