import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///../prisma/dev.db",
)

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Bill(Base):
    __tablename__ = "Bill"

    id = Column(String, primary_key=True)
    accountNumber = Column(String, nullable=False)
    billNumber = Column(String, nullable=False, unique=True)
    consumerName = Column(String, nullable=True)
    fatherName = Column(String, nullable=True)
    address = Column(String, nullable=True)
    division = Column(String, nullable=True)
    subdivision = Column(String, nullable=True)
    category = Column(String, nullable=True)
    connectionType = Column(String, nullable=True)
    supplyType = Column(String, nullable=True)
    meterNumber = Column(String, nullable=True)
    sanctionedLoad = Column(Float, nullable=True)
    billedDemand = Column(Float, nullable=True)
    securityDeposit = Column(Float, nullable=True)
    billMonth = Column(String, nullable=False)
    billDate = Column(DateTime, nullable=True)
    dueDate = Column(DateTime, nullable=True)
    disconnectionDate = Column(DateTime, nullable=True)
    billingStart = Column(DateTime, nullable=True)
    billingEnd = Column(DateTime, nullable=True)
    connectionDate = Column(DateTime, nullable=True)
    previousReading = Column(Float, nullable=True)
    currentReading = Column(Float, nullable=True)
    consumption = Column(Float, nullable=True)
    previousKVAH = Column(Float, nullable=True)
    currentKVAH = Column(Float, nullable=True)
    kvaConsumption = Column(Float, nullable=True)
    powerFactor = Column(Float, nullable=True)
    solarExport = Column(Float, nullable=True)
    openingSolarBalance = Column(Float, nullable=True)
    closingSolarBalance = Column(Float, nullable=True)
    previousDue = Column(Float, nullable=True)
    currentBill = Column(Float, nullable=True)
    payableAmount = Column(Float, nullable=True)
    energyCharges = Column(Float, nullable=True)
    demandCharges = Column(Float, nullable=True)
    electricityDuty = Column(Float, nullable=True)
    fppa = Column(Float, nullable=True)
    minimumCharges = Column(Float, nullable=True)
    excessDemandPenalty = Column(Float, nullable=True)
    otherCharges = Column(Float, nullable=True)
    subsidy = Column(Float, nullable=True)
    arrears = Column(Float, nullable=True)
    credit = Column(Float, nullable=True)
    debit = Column(Float, nullable=True)
    rebate = Column(Float, nullable=True)
    meterCharges = Column(Float, nullable=True)
    dueSecurity = Column(Float, nullable=True)
    paymentDate = Column(DateTime, nullable=True)
    paymentAmount = Column(Float, nullable=True)
    paymentMode = Column(String, nullable=True)
    receiptNumber = Column(String, nullable=True)
    rawText = Column(Text, nullable=False)
    pdfPath = Column(String, nullable=True)
    uploadedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("Bill_billNumber_key", "billNumber", unique=True),
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate():
    """Add new columns to existing SQLite tables without data loss."""
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(Bill)")
    cols = [row[1] for row in cur.fetchall()]
    if "pdfPath" not in cols:
        cur.execute('ALTER TABLE "Bill" ADD COLUMN pdfPath VARCHAR')
        conn.commit()
    conn.close()


_migrate()
