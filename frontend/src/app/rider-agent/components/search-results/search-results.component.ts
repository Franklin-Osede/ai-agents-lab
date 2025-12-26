import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-search-results",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./search-results.component.html",
  styleUrl: "./search-results.component.scss",
})
export class SearchResultsComponent implements OnInit {
  showGreeting = true; // Show immediately for debugging
  private location = inject(Location);

  ngOnInit() {
    console.log("SearchResultsComponent Initialized");
    // Removed setTimeout to rule out async/change detection issues
  }

  goBack(): void {
    console.log("Going back...");
    this.location.back();
  }
}
