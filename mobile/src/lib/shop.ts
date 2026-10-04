/**
 * Who is selling, and who hears complaints - the seller details the law
 * requires an e-commerce app to show.
 *
 * @remarks
 * The Consumer Protection (E-Commerce) Rules 2020, rule 4(2), want the
 * seller's legal name, geographic address and customer-care contact shown
 * "in a clear and accessible manner"; rule 4(4) wants a grievance officer's
 * name, designation and contact. The same paragraph also covers the contact
 * person the IT (SPDI) Rules 2011, rule 5(9), and the DPDP Act 2023 ask for.
 *
 * Deliberately the minimum: no district, PIN or GSTIN. GSTIN is required on
 * the shop's name board and on its bills, not in its own app.
 *
 * Shown one tap away (Account -> Shop details & complaints, which opens the
 * legal screen), never on the shopping screens.
 *
 * Keep in step with `client/src/lib/shop.ts`.
 *
 * @packageDocumentation
 */

/** The legal seller. sKirana is the app's name, not the seller's. */
export const SELLER_NAME = "Suneel Kirana Store";

/** Where the shop is. */
export const SELLER_ADDRESS = "Main Market, Birsinghpur";

/** Customer-care mobile number. */
export const SELLER_PHONE = "+91 74402 48190";

/** The grievance officer's name. */
export const GRIEVANCE_OFFICER = "Shivanshu Gupta";

/** The grievance officer's designation. */
export const GRIEVANCE_DESIGNATION = "App Manager";

/** Email for privacy and deletion requests, and written complaints. */
export const CONTACT_EMAIL = "shivanshu2019gupta@gmail.com";
