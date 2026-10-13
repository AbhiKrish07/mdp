"""Transport Factory: selects Serial, TCP, or Virtual transport based on environment."""

import os
import logging
from .base import BaseTransport
from .serial_transport import SerialTransport
from .tcp_transport import TCPTransport
from .virtual_transport import VirtualTransport

logger = logging.getLogger("TransportFactory")

def get_transport(mode: str = "auto", port: str = None, host: str = None) -> BaseTransport:
    """Instantiates the best available transport driver."""
    m = mode.lower()
    if m == "virtual" or os.environ.get("COMPANION_VIRTUAL_HW") == "1":
        return VirtualTransport()
    elif m == "tcp" and host:
        return TCPTransport(host=host)
    else:
        # Try serial first
        serial_drv = SerialTransport(port=port)
        if serial_drv.connect():
            return serial_drv
        logger.info("[TransportFactory] Physical serial unavailable. Using VirtualTransport.")
        v_drv = VirtualTransport()
        v_drv.connect()
        return v_drv
