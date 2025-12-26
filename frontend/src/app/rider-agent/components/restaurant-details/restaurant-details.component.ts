import { Component, inject, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";

interface MenuCard {
  name: string;
  price: string;
  image: string;
  tags: string[];
  bestValue?: boolean;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
  cards?: MenuCard[];
}

@Component({
  selector: "app-restaurant-details",
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: "./restaurant-details.component.html",
  styleUrl: "./restaurant-details.component.scss",
})
export class RestaurantDetailsComponent {
  private voiceService = inject(VoiceService);

  inputText = signal("");
  isRecording = signal(false);
  messages = signal<ChatMessage[]>([
    {
      role: "ai",
      text: "Hi! What are you craving today? You can ask for ingredients like avocado or dietary needs like vegan.",
      time: "10:23 AM",
    },
  ]);

  async toggleRecording() {
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.voiceService.stopListening();
    } else {
      this.isRecording.set(true);
      try {
        const transcript = await this.voiceService.listen();
        this.isRecording.set(false);
        if (transcript) {
          this.inputText.set(transcript);
          this.sendMessage();
        }
      } catch (error) {
        console.error("Voice error:", error);
        this.isRecording.set(false);
      }
    }
  }

  sendMessage() {
    const text = this.inputText().trim();
    if (!text) return;

    // Add User Message
    this.messages.update((msgs) => [
      ...msgs,
      {
        role: "user",
        text: text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    this.inputText.set("");

    // Mock AI Response
    setTimeout(() => {
      this.messages.update((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: "Got it. Here are our top burgers, onion-free.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cards: [
            {
              name: "Classic Smash",
              price: "$12.99",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBPeg5O0gLcFV-kcdU_N7kjif9basfHcJn8sUZfbJivZmbtR-hSnHGupClZ-d4bhCewBvtKPCtT_AYQCWnKYhzxF3_WfKpiDf1C3QlY8fUW9yS-laG9uG3C-TsBZxoHGY-dyji4R0wlnTgvLSQ0k-aLV9QVvwdDapHSWKtDq1hMjWTJtUmnfUF7PM9z0cPr-UMBLEvokHsmU96e5NyYP9JXoVTM8fUmlvwvnucj-R59fkjmcNxsEAaqCo5W0AA5HB5he3h2IPgNbmE",
              tags: ["Onion-Free", "Popular"],
            },
            {
              name: "Truffle Mushroom",
              price: "$15.50",
              image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCCFhGR5pfdPIHc-Xdd_nmrZS_Gjes8qFwiu5n9iXOAVUipvoH1wlM0bXh3jY1-aDRq6boKldhNJCrifGuPH9Vikf-nxlxKSw7rJpPwcQjMOiAyvEMFNlXYQVamkeExJuX8xpvv5tBtUFdeIf4zKeRH73Y7bC2II42INOKTCRaBHrXRC6X8NX0hdjrUzJ5Zoy0JQU8Q4cpynPIheM5pv2tSnCGInIQAnXlzFdji4-QkW7NhBLuuhrSvsyjn8ETxJZaHlgljYGMkG9U",
              tags: ["Onion-Free"],
              bestValue: true,
            },
          ],
        },
      ]);
    }, 1000);
  }
}
