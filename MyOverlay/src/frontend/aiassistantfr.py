import webbrowser
import customtkinter as ctk

ctk.set_appearance_mode("Dark")


class DetailsWindow(ctk.CTkToplevel):

    def __init__(self, parent, status, verdict_text, sources):
        super().__init__(parent)

        self.title("Rezultatele verificării")
        self.attributes("-topmost", True)

        width, height = 460, 360
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        x = (screen_w - width) // 2
        y = (screen_h - height) // 2
        self.geometry(f"{width}x{height}+{x}+{y}")

        status_data = {
            "red": ("🔴 FAKE / INFORMAȚIE FALSĂ", "red"),
            "yellow": ("🟡 SUSPECT / NESIGUR", "yellow"),
            "green": ("🟢 VERIDIC / VERIFICAT", "green"),
        }
        title_str, title_color = status_data.get(
            status, ("VERIFICARE", "white")
        )

        self.lbl_verdict = ctk.CTkLabel(
            self,
            text=title_str,
            font=("Arial", 16, "bold"),
            text_color=title_color,
        )
        self.lbl_verdict.pack(pady=(15, 5))

        self.lbl_info = ctk.CTkLabel(
            self, text=verdict_text, font=("Arial", 13), wraplength=420
        )
        self.lbl_info.pack(pady=10, padx=15)

        self.lbl_sources = ctk.CTkLabel(
            self,
            text="Verificat cu sursele (Whitelist):",
            font=("Arial", 12, "bold"),
        )
        self.lbl_sources.pack(anchor="w", padx=25, pady=(10, 5))

        for site_name, site_url in sources.items():
            btn_link = ctk.CTkButton(
                self,
                text=f"🔗 {site_name}",
                fg_color="transparent",
                text_color="#1E90FF",
                hover_color="#2B2B2B",
                anchor="w",
                command=lambda url=site_url: webbrowser.open(url),
            )
            btn_link.pack(fill="x", padx=20, pady=2)

        self.btn_close = ctk.CTkButton(
            self,
            text="Închide [ X ]",
            fg_color="#333333",
            hover_color="#555555",
            command=self.destroy,
        )
        self.btn_close.pack(pady=15)


class BadgeNotification(ctk.CTk):

    def __init__(self):
        super().__init__()

        self.overrideredirect(True)
        self.attributes("-topmost", True)
        self.config(background="black")
        self.attributes("-transparentcolor", "black")

        badge_size = 30
        screen_width = self.winfo_screenwidth()
        x_pos = screen_width - badge_size - 15
        y_pos = 140

        self.geometry(f"{badge_size}x{badge_size}+{x_pos}+{y_pos}")

        self.current_status = "green"
        self.current_verdict_text = ""
        self.current_sources = {}

        self.badge_button = ctk.CTkButton(
            self,
            text="",
            width=badge_size,
            height=badge_size,
            corner_radius=15,
            fg_color="gray",
            hover_color="#555555",
            command=self.open_details,
        )
        self.badge_button.pack(fill="both", expand=True)

        self.details_window = None

    def update_data(self, status, verdict_text, sources):
        self.current_status = status
        self.current_verdict_text = verdict_text
        self.current_sources = sources

        colors = {
            "red": ("red", "#darkred"),
            "yellow": ("yellow", "#8B8B00"),
            "green": ("green", "#006400"),
        }
        bg, hover = colors.get(status, ("gray", "#555555"))
        self.badge_button.configure(fg_color=bg, hover_color=hover)

    def open_details(self):
        if (
            self.details_window is not None
            and self.details_window.winfo_exists()
        ):
            self.details_window.focus()
            return

        self.details_window = DetailsWindow(
            self,
            status=self.current_status,
            verdict_text=self.current_verdict_text,
            sources=self.current_sources,
        )


if __name__ == "__main__":
    app = BadgeNotification()
    app.mainloop()