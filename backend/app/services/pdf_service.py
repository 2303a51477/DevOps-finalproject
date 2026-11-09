import io
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_qr_code_image(data_text: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(data_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def generate_certificate_pdf(
    learner_name: str,
    course_title: str,
    provider_name: str,
    certificate_id: str,
    verification_id: str,
    issue_date: datetime,
    score: float,
    status: str = "valid",
    frontend_verify_url: str = "http://localhost:5173/verify"
) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # 11 x 8.5 inches landscape (792 x 612 pt)
    width, height = landscape(letter)
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    # Background fill
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Elegant Decorative Borders
    # Outer Border
    c.setStrokeColor(colors.HexColor("#0284c7")) # Sky 600
    c.setLineWidth(5)
    c.rect(20, 20, width - 40, height - 40)
    
    # Inner Thin Gold/Slate Border
    c.setStrokeColor(colors.HexColor("#0369a1")) # Sky 700
    c.setLineWidth(1.5)
    c.rect(26, 26, width - 52, height - 52)
    
    # Corner Accents
    corner_size = 24
    c.setFillColor(colors.HexColor("#0284c7"))
    c.circle(32, height - 32, 6, fill=1, stroke=0)
    c.circle(width - 32, height - 32, 6, fill=1, stroke=0)
    c.circle(32, 32, 6, fill=1, stroke=0)
    c.circle(width - 32, 32, 6, fill=1, stroke=0)
    
    # Status Watermark if Revoked
    if status.lower() == "revoked":
        c.saveState()
        c.setFont("Helvetica-Bold", 60)
        c.setFillColor(colors.HexColor("#ef4444"), alpha=0.25)
        c.translate(width / 2, height / 2)
        c.rotate(35)
        c.drawCentredString(0, 0, "CERTIFICATE REVOKED")
        c.restoreState()
    
    # Header: Issuer / Platform Name
    c.setFillColor(colors.HexColor("#0369a1"))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 60, "GLOBAL CREDENTIAL VERIFICATION SYSTEM")
    
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 76, f"Accredited Provider: {provider_name}")
    
    # Certificate Title
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 120, "CERTIFICATE OF ACHIEVEMENT")
    
    # Subtitle
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width / 2, height - 146, "This is proudly presented to certify that")
    
    # Learner Name
    c.setFillColor(colors.HexColor("#0284c7"))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 190, learner_name)
    
    # Underline under learner name
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    name_len = len(learner_name) * 13
    c.line((width / 2) - (name_len / 2), height - 200, (width / 2) + (name_len / 2), height - 200)
    
    # Completion Description
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width / 2, height - 230, "has successfully fulfilled all learning objectives, assessments, and criteria for:")
    
    # Course Title
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, height - 264, f'"{course_title}"')
    
    # Performance & Issue Details
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(
        width / 2, height - 296,
        f"Academic Grade: {score:.1f}%  •  Issued on: {issue_date.strftime('%B %d, %Y')}"
    )
    
    # Bottom Section:
    # 1. Left side: Signatures & Authority Seal
    # 2. Right side: QR Code & Verification ID
    
    # Authority Signature Box
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    c.line(80, 110, 260, 110)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(80, 95, "Authorized Academic Officer")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 9)
    c.drawString(80, 82, provider_name)
    
    # Official Seal Badge
    c.setFillColor(colors.HexColor("#e0f2fe"))
    c.setStrokeColor(colors.HexColor("#0284c7"))
    c.setLineWidth(2)
    c.circle(width / 2, 110, 36, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#0369a1"))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2, 118, "OFFICIAL")
    c.drawCentredString(width / 2, 106, "VERIFIED")
    c.drawCentredString(width / 2, 94, "CREDENTIAL")
    
    # QR Code generation
    verify_url = f"{frontend_verify_url.rstrip('/')}/{verification_id}"
    qr_buf = generate_qr_code_image(verify_url)
    
    # Draw QR Code image onto canvas
    from reportlab.lib.utils import ImageReader
    qr_img = ImageReader(qr_buf)
    c.drawImage(qr_img, width - 210, 65, width=80, height=80)
    
    # Verification Info on the right
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(width - 220, 120, "Scan to Verify Authenticity")
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 8)
    c.drawRightString(width - 220, 105, f"Verification ID: {verification_id}")
    c.drawRightString(width - 220, 92, f"Certificate ID: {certificate_id}")
    c.drawRightString(width - 220, 79, f"Status: {status.upper()}")
    
    # Footer disclaimer
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, 34, "Cryptographically signed and verifiable online via the Credential Verification Portal.")
    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
