import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendAnalysisCompletionEmail(to: string, caseTitle: string, caseId: string, results: any) {
    const subject = `Analysis Complete: ${caseTitle}`;

    // Simple summary
    const totalDetections = results?.statistics?.total_detections || 0;
    const matchesFound = results?.statistics?.matches_found || 0;
    const topMatchConfidence = results?.matches?.[0]?.confidence ? (results.matches[0].confidence * 100).toFixed(1) + '%' : 'N/A';

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Analysis Complete</h2>
            <p>The analysis for your case <strong>"${caseTitle}"</strong> (ID: ${caseId}) has been completed.</p>
            
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Results Summary</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Status:</strong> ${matchesFound > 0 ? '<span style="color: green;">Potential Match Found</span>' : 'No Matches Found'}</li>
                    <li><strong>Total Detections:</strong> ${totalDetections}</li>
                    <li><strong>Matches Found:</strong> ${matchesFound}</li>
                    <li><strong>Top Match Confidence:</strong> ${topMatchConfidence}</li>
                </ul>
            </div>

            <p>Please log in to your dashboard to view the full detailed report and review the matches.</p>
            
            <a href="${process.env.NEXTAUTH_URL}/admin/cases/${caseId}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Results</a>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"Missing Person Finder" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
